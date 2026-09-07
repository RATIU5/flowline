import { Effect, Predicate, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

const Repository = Schema.Union([
  Schema.String,
  Schema.Struct({ url: Schema.String }),
]);
const PackageMetadata = Schema.Struct({
  versions: Schema.Record(
    Schema.String,
    Schema.Struct({
      deprecated: Schema.optional(Schema.String),
      repository: Schema.optional(Repository),
    }),
  ),
  "dist-tags": Schema.Record(Schema.String, Schema.String),
  repository: Schema.optional(Repository),
});

export interface PackageDetails {
  readonly versions: readonly string[];
  readonly tags: Record<string, string>;
  readonly repository?: string | undefined;
  readonly deprecated: Record<string, string>;
}

export const getPackageDetails = Effect.fn("getPackageDetails")(function* (
  name: string,
  registry: string,
) {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.filterStatusOk,
    HttpClient.retryTransient({ times: 2 }),
  );
  const metadata = yield* client
    .get(`${registry.replace(/\/$/, "")}/${encodeURIComponent(name)}`, {
      headers: { Accept: "application/json" },
    })
    .pipe(
      Effect.flatMap(HttpClientResponse.schemaBodyJson(PackageMetadata)),
      Effect.timeout("20 seconds"),
    );
  const repository =
    metadata.repository ??
    metadata.versions[metadata["dist-tags"].latest ?? ""]?.repository;
  return {
    versions: Object.keys(metadata.versions).sort((a, b) =>
      Bun.semver.order(b, a),
    ),
    tags: metadata["dist-tags"],
    repository: Predicate.isString(repository) ? repository : repository?.url,
    deprecated: Object.fromEntries(
      Object.entries(metadata.versions).flatMap(([version, value]) =>
        value.deprecated ? [[version, sanitize(value.deprecated)]] : [],
      ),
    ),
  } satisfies PackageDetails;
});

/** Strip terminal escapes and controls from publisher-controlled strings. */
function sanitize(value: string): string {
  return value
    .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, "");
}

function githubRepository(repository: string | undefined): string | null {
  if (!repository) return null;
  const normalized = repository
    .replace(/^git\+/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^github:/, "https://github.com/");
  try {
    const url = new URL(normalized);
    if (url.hostname !== "github.com" || url.username || url.password)
      return null;
    const parts = url.pathname
      .replace(/\.git\/?$/, "")
      .split("/")
      .filter(Boolean);
    if (parts.length !== 2 || parts.some((part) => !/^[\w.-]+$/.test(part)))
      return null;
    return parts.join("/");
  } catch {
    return null;
  }
}

const Releases = Schema.Array(
  Schema.Struct({
    tag_name: Schema.String,
    body: Schema.NullOr(Schema.String),
    html_url: Schema.String,
  }),
);
type Release = (typeof Releases.Type)[number];
const releaseCache = new Map<string, readonly Release[]>();

export const getReleaseNotes = Effect.fn("getReleaseNotes")(function* (
  name: string,
  version: string,
  repository?: string,
) {
  const repo = githubRepository(repository);
  if (!repo)
    return {
      text: "No supported GitHub repository was published for this package.",
      url: null,
    };
  const releasesUrl = `https://github.com/${repo}/releases`;
  const fetchNotes = Effect.gen(function* () {
    let releases = releaseCache.get(repo);
    if (!releases) {
      const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.filterStatusOk,
        HttpClient.retryTransient({ times: 1 }),
      );
      releases = yield* client
        .get(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "flowline-dependency-wizard",
          },
        })
        .pipe(
          Effect.flatMap(HttpClientResponse.schemaBodyJson(Releases)),
          Effect.timeout("15 seconds"),
        );
      releaseCache.set(repo, releases);
    }
    const basename = name.split("/").at(-1)!;
    const tags = new Set([
      version,
      `v${version}`,
      `${name}@${version}`,
      `${basename}@${version}`,
    ]);
    const release = releases.find((entry) => tags.has(entry.tag_name));
    if (!release)
      return {
        text: `No release notes matching ${sanitize(name)}@${sanitize(version)} in the 100 most recent GitHub releases.`,
        url: releasesUrl,
      };
    const body = sanitize(release.body ?? "").trim();
    const excerpt = body.split("\n").slice(0, 20).join("\n").slice(0, 2000);
    return {
      text: excerpt
        ? `${excerpt}${excerpt.length < body.length ? "\n[Excerpt; see full release below.]" : ""}`
        : "This release has no published notes.",
      url: `https://github.com/${repo}/releases/tag/${encodeURIComponent(release.tag_name)}`,
    };
  });
  return yield* fetchNotes.pipe(
    Effect.catch(() =>
      Effect.succeed({
        text: "Release notes could not be fetched (GitHub may be unavailable or rate limited).",
        url: releasesUrl,
      }),
    ),
  );
});

export const socketUrl = (name: string, version: string): string =>
  `https://socket.dev/npm/package/${name.split("/").map(encodeURIComponent).join("/")}/overview/${encodeURIComponent(version)}`;
