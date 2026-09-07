import { Data, Effect, FileSystem, Path, Schema, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import type { CatalogEntry } from "./catalog";

class PatchError extends Data.TaggedError("PatchError")<{
  readonly message: string;
}> {}
export interface VerifiedPatch {
  readonly name: string;
  readonly version: string;
  readonly oldKey: string;
  readonly patchPath: string;
  readonly contents: string;
}
const PatchManifest = Schema.Struct({
  patchedDependencies: Schema.optional(
    Schema.Record(Schema.String, Schema.String),
  ),
});
const Packed = Schema.Array(Schema.Struct({ filename: Schema.String }));

const run = Effect.fn("patchCommand")(function* (
  cwd: string,
  command: string,
  args: readonly string[],
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  return yield* Effect.scoped(
    Effect.gen(function* () {
      const handle = yield* spawner.spawn(
        ChildProcess.make(command, args, { cwd }),
      );
      const [code, stdout, stderr] = yield* Effect.all(
        [
          handle.exitCode,
          Stream.mkString(Stream.decodeText(handle.stdout)),
          Stream.mkString(Stream.decodeText(handle.stderr)),
        ],
        { concurrency: "unbounded" },
      );
      if (code !== 0)
        return yield* new PatchError({
          message: `${command} failed: ${stderr.trim() || stdout.trim()}`,
        });
      return stdout;
    }),
  ).pipe(Effect.timeout("60 seconds"));
});

/** Downloads into a disposable directory; never runs package lifecycle scripts. */
export const verifyPatch = Effect.fn("verifyPatch")(function* (
  name: string,
  version: string,
  patchPath: string,
  registry: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  return yield* Effect.scoped(
    Effect.gen(function* () {
      const temporary = yield* fs.makeTempDirectoryScoped({
        prefix: "flowline-patch-",
      });
      const packed = yield* run(temporary, "npm", [
        "pack",
        `${name}@${version}`,
        "--ignore-scripts",
        "--json",
        "--registry",
        registry,
        "--cache",
        path.join(temporary, "cache"),
      ]);
      const files = yield* Schema.decodeEffect(Schema.fromJsonString(Packed))(
        packed,
      );
      const filename = files[0]?.filename;
      if (
        files.length !== 1 ||
        !filename ||
        path.basename(filename) !== filename
      ) {
        return yield* new PatchError({
          message: "npm returned an unexpected archive path",
        });
      }
      const archive = path.join(temporary, filename);
      const listing = yield* run(temporary, "tar", ["-tzf", archive]);
      if (
        listing
          .trim()
          .split("\n")
          .some(
            (file) =>
              !file.startsWith("package/") || file.split("/").includes(".."),
          )
      ) {
        return yield* new PatchError({
          message: "Package archive contains unsupported paths",
        });
      }
      const modes = yield* run(temporary, "tar", ["-tvzf", archive]);
      if (
        modes
          .trim()
          .split("\n")
          .some((line) => !/^[d-]/.test(line))
      ) {
        return yield* new PatchError({
          message:
            "Automatic patch verification does not support archive links",
        });
      }
      yield* run(temporary, "tar", [
        "-xzf",
        archive,
        "--no-same-owner",
        "--no-same-permissions",
      ]);
      yield* run(path.join(temporary, "package"), "git", [
        "apply",
        "--check",
        "--",
        patchPath,
      ]);
    }),
  );
});

export const preparePatchMigrations = Effect.fn("preparePatchMigrations")(
  function* (
    manifestPath: string,
    updates: readonly { entry: CatalogEntry; version: string }[],
    registry: string,
  ) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const manifest = yield* Schema.decodeEffect(
      Schema.fromJsonString(PatchManifest),
    )(yield* fs.readFileString(manifestPath));
    const verified: VerifiedPatch[] = [];
    for (const { entry, version } of updates) {
      if (entry.configured.replace(/^[~^]/, "") === version) continue;
      for (const [oldKey, patchPath] of Object.entries(
        manifest.patchedDependencies ?? {},
      )) {
        if (
          !oldKey.startsWith(`${entry.name}@`) ||
          oldKey === `${entry.name}@${version}`
        )
          continue;
        if (
          verified.some(
            (item) => item.oldKey === oldKey && item.version === version,
          )
        )
          continue;
        const absolute = path.resolve(path.dirname(manifestPath), patchPath);
        const contents = yield* fs.readFileString(absolute);
        yield* verifyPatch(entry.name, version, absolute, registry);
        if ((yield* fs.readFileString(absolute)) !== contents) {
          return yield* new PatchError({
            message: "Patch changed during verification; retry the save",
          });
        }
        verified.push({
          name: entry.name,
          version,
          oldKey,
          patchPath,
          contents,
        });
      }
    }
    return verified;
  },
);
