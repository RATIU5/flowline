import { Data, Effect, FileSystem, Path, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import type { VerifiedPatch } from "./patches";

const Versions = Schema.Record(Schema.String, Schema.String);
export const Manifest = Schema.Struct({
  patchedDependencies: Schema.optional(Versions),
  workspaces: Schema.Struct({
    catalog: Schema.optional(Versions),
    catalogs: Schema.optional(Schema.Record(Schema.String, Versions)),
  }),
});
const Tags = Schema.Record(Schema.String, Schema.String);
interface TagResult {
  readonly name: string;
  readonly tags: Record<string, string>;
  readonly error: string | null;
}
class CatalogError extends Data.TaggedError("CatalogError")<{
  readonly message: string;
}> {}

export interface CatalogEntry {
  readonly catalog: string;
  readonly name: string;
  readonly configured: string;
  readonly isDefault?: boolean;
}
export interface VersionRow extends CatalogEntry {
  readonly latest: string | null;
  readonly rc: string | null;
  readonly beta: string | null;
  readonly error: string | null;
  readonly target: string | null;
  readonly status: "current" | "outdated" | "ahead" | "unknown" | "error";
}
export const readEntries = (manifest: typeof Manifest.Type): CatalogEntry[] => [
  ...Object.entries(manifest.workspaces.catalog ?? {}).map(
    ([name, configured]) => ({
      catalog: "default",
      isDefault: true,
      name,
      configured,
    }),
  ),
  ...Object.entries(manifest.workspaces.catalogs ?? {}).flatMap(
    ([catalog, versions]) =>
      Object.entries(versions).map(([name, configured]) => ({
        catalog,
        isDefault: false,
        name,
        configured,
      })),
  ),
];
// Restrict comparisons to a complete version with an optional caret or tilde.
const simpleVersion =
  /^(\^|~)?((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)$/;
export const classifyVersion = (
  entry: CatalogEntry,
  tags: Record<string, string>,
  error: string | null = null,
): VersionRow => {
  const base = {
    ...entry,
    latest: tags.latest ?? null,
    rc: tags.rc ?? null,
    beta: tags.beta ?? null,
    error,
  };
  if (error) return { ...base, target: null, status: "error" };
  const configured = simpleVersion.exec(entry.configured)?.[2];
  if (!configured) return { ...base, target: null, status: "unknown" };
  const channel = /-(rc|beta)(?:\.|$)/.exec(configured)?.[1];
  const candidates = [tags.latest, ...(channel ? [tags[channel]] : [])].filter(
    (version): version is string =>
      !!version && !!simpleVersion.exec(version) && !/^[~^]/.test(version),
  );
  candidates.sort(Bun.semver.order);
  const newest = candidates.at(-1);
  if (!newest) return { ...base, target: null, status: "unknown" };
  const order = Bun.semver.order(configured, newest);
  return {
    ...base,
    target: order > 0 ? null : newest,
    status: order < 0 ? "outdated" : order > 0 ? "ahead" : "current",
  };
};

export const checkVersions = Effect.fn("checkVersions")(function* (
  manifestPath: string,
  registry: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const manifest = yield* Schema.decodeEffect(Schema.fromJsonString(Manifest))(
    yield* fs.readFileString(manifestPath),
  );
  const entries = readEntries(manifest);
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.filterStatusOk,
    HttpClient.retryTransient({ times: 2 }),
  );
  const results = yield* Effect.forEach(
    [...new Set(entries.map((entry) => entry.name))].sort(),
    (name) =>
      client
        .get(
          `${registry.replace(/\/$/, "")}/-/package/${encodeURIComponent(name)}/dist-tags`,
        )
        .pipe(
          Effect.flatMap(HttpClientResponse.schemaBodyJson(Tags)),
          Effect.flatMap((tags) =>
            tags.latest
              ? Effect.succeed(tags)
              : Effect.fail(
                  new CatalogError({ message: `No latest tag for ${name}` }),
                ),
          ),
          Effect.timeout("15 seconds"),
          Effect.map((tags): TagResult => ({ name, tags, error: null })),
          Effect.catch((error) =>
            Effect.succeed<TagResult>({
              name,
              tags: {},
              error: String(error),
            }),
          ),
        ),
    { concurrency: 8 },
  );
  const byName = new Map(results.map((result) => [result.name, result]));
  return entries.map((entry) => {
    const result = byName.get(entry.name)!;
    return classifyVersion(entry, result.tags, result.error);
  });
});

export const saveUpdates = Effect.fn("saveUpdates")(function* (
  manifestPath: string,
  updates: readonly { entry: CatalogEntry; version: string }[],
  verifiedPatches: readonly VerifiedPatch[] = [],
) {
  if (updates.length === 0) return;
  const fs = yield* FileSystem.FileSystem;
  const contents = yield* fs.readFileString(manifestPath);
  const path = yield* Path.Path;
  let manifest = yield* Schema.decodeEffect(Schema.fromJsonString(Manifest))(
    contents,
    { onExcessProperty: "preserve" },
  );
  const seen = new Set<string>();
  for (const { entry, version } of updates) {
    const versions =
      entry.isDefault === true
        ? manifest.workspaces.catalog
        : manifest.workspaces.catalogs?.[entry.catalog];
    const key = `${entry.isDefault === true}\0${entry.catalog}\0${entry.name}`;
    if (seen.has(key))
      return yield* new CatalogError({
        message: `Duplicate update for ${entry.name} in ${entry.catalog}`,
      });
    seen.add(key);
    if (
      !versions ||
      !Object.hasOwn(versions, entry.name) ||
      versions[entry.name] !== entry.configured
    ) {
      return yield* new CatalogError({
        message: `${entry.name} changed since the scan. Refresh before saving.`,
      });
    }
    if (!simpleVersion.test(version) || /^[~^]/.test(version))
      return yield* new CatalogError({
        message: `Invalid selected version for ${entry.name}: ${version}`,
      });
    const old = simpleVersion.exec(entry.configured)?.[2];
    const patches = Object.keys(manifest.patchedDependencies ?? {}).filter(
      (key) => key.startsWith(`${entry.name}@`),
    );
    if (
      patches.some((key) => key.slice(entry.name.length + 1) !== version) &&
      old !== version
    ) {
      for (const oldKey of patches) {
        if (oldKey === `${entry.name}@${version}`) continue;
        const verified = verifiedPatches.find(
          (item) =>
            item.oldKey === oldKey &&
            item.version === version &&
            item.name === entry.name,
        );
        if (
          !verified ||
          manifest.patchedDependencies?.[oldKey] !== verified.patchPath
        ) {
          return yield* new CatalogError({
            message: `${entry.name} needs patch verification before saving. Retry through the wizard to check the patch against ${version}.`,
          });
        }
        if (
          (yield* fs.readFileString(
            path.resolve(path.dirname(manifestPath), verified.patchPath),
          )) !== verified.contents
        ) {
          return yield* new CatalogError({
            message: `Patch for ${entry.name} changed after verification. Retry the save.`,
          });
        }
        const newKey = `${entry.name}@${version}`;
        const existing = manifest.patchedDependencies?.[newKey];
        if (existing && existing !== verified.patchPath) {
          return yield* new CatalogError({
            message: `${newKey} already has a different patch. Resolve the conflicting patches manually.`,
          });
        }
        manifest = {
          ...manifest,
          patchedDependencies: {
            ...manifest.patchedDependencies,
            [newKey]: verified.patchPath,
          },
        };
      }
    }
    const updated = {
      ...versions,
      [entry.name]: `${simpleVersion.exec(entry.configured)?.[1] ?? ""}${version}`,
    };
    manifest = {
      ...manifest,
      workspaces:
        entry.isDefault === true
          ? { ...manifest.workspaces, catalog: updated }
          : {
              ...manifest.workspaces,
              catalogs: {
                ...manifest.workspaces.catalogs,
                [entry.catalog]: updated,
              },
            },
    };
  }
  const indent = /^([\t ]+)"/m.exec(contents)?.[1] ?? "  ";
  const output =
    (yield* Schema.encodeEffect(
      Schema.fromJsonString(Manifest, { space: indent }),
    )(manifest, { onExcessProperty: "preserve" })) +
    (contents.endsWith("\n") ? "\n" : "");
  yield* Effect.scoped(
    Effect.gen(function* () {
      const temporary = yield* fs.makeTempFileScoped({
        directory: path.dirname(manifestPath),
        prefix: ".catalog-update-",
      });
      yield* fs.writeFileString(temporary, output);
      if ((yield* fs.readFileString(manifestPath)) !== contents)
        return yield* new CatalogError({
          message:
            "package.json changed while preparing the update. Refresh before saving.",
        });
      yield* fs.rename(temporary, manifestPath);
    }),
  );
});
