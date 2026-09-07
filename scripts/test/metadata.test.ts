import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

import {
  getPackageDetails,
  getReleaseNotes,
  socketUrl,
} from "../src/dependencies/metadata";

function fixtureFetch(body: Schema.Json, requests: string[]) {
  return Object.assign(
    async (input: Parameters<typeof fetch>[0]) => {
      requests.push(input instanceof Request ? input.url : input.toString());
      return Response.json(body);
    },
    { preconnect: fetch.preconnect },
  );
}

describe("dependency metadata", () => {
  test("sorts npm versions numerically and preserves deprecation notices", async () => {
    const requests: string[] = [];
    const details = await Effect.runPromise(
      getPackageDetails("@scope/demo", "https://registry.npmjs.org/").pipe(
        Effect.provide(FetchHttpClient.layer),
        Effect.provideService(
          FetchHttpClient.Fetch,
          fixtureFetch(
            {
              versions: {
                "1.9.0": { deprecated: "Use a newer release" },
                "2.0.0-rc.1": {},
                "1.10.0": {},
                "2.0.0": {},
              },
              "dist-tags": { latest: "2.0.0", rc: "2.0.0-rc.1" },
              repository: { url: "git+https://github.com/fixture/demo.git" },
            },
            requests,
          ),
        ),
      ),
    );
    expect(details.versions).toEqual([
      "2.0.0",
      "2.0.0-rc.1",
      "1.10.0",
      "1.9.0",
    ]);
    expect(details.deprecated).toEqual({ "1.9.0": "Use a newer release" });
    expect(details.tags.latest).toBe("2.0.0");
    expect(details.repository).toBe("git+https://github.com/fixture/demo.git");
    expect(requests).toEqual(["https://registry.npmjs.org/%40scope%2Fdemo"]);
  });

  test("finds an exact scoped release tag instead of the newest unrelated release", async () => {
    const requests: string[] = [];
    const notes = await Effect.runPromise(
      getReleaseNotes(
        "@scope/demo",
        "2.0.0",
        "git+https://github.com/fixture/release-notes-test.git",
      ).pipe(
        Effect.provide(FetchHttpClient.layer),
        Effect.provideService(
          FetchHttpClient.Fetch,
          fixtureFetch(
            [
              {
                tag_name: "other@9.0.0",
                body: "Unrelated changes",
                html_url:
                  "https://github.com/fixture/release-notes-test/releases/tag/other%409.0.0",
              },
              {
                tag_name: "@scope/demo@2.0.0",
                body: "Fixed rendering.\u001b[31m\nImproved startup.",
                html_url:
                  "https://github.com/fixture/release-notes-test/releases/tag/%40scope%2Fdemo%402.0.0",
              },
            ],
            requests,
          ),
        ),
      ),
    );
    expect(notes.text).toBe("Fixed rendering.\nImproved startup.");
    expect(notes.url).toBe(
      "https://github.com/fixture/release-notes-test/releases/tag/%40scope%2Fdemo%402.0.0",
    );
    expect(requests).toEqual([
      "https://api.github.com/repos/fixture/release-notes-test/releases?per_page=100",
    ]);
  });

  test("returns a graceful result without HTTP for unsupported repositories", async () => {
    const requests: string[] = [];
    const notes = await Effect.runPromise(
      getReleaseNotes(
        "demo",
        "1.0.0",
        "https://github.com.example.org/fixture/demo",
      ).pipe(
        Effect.provide(FetchHttpClient.layer),
        Effect.provideService(
          FetchHttpClient.Fetch,
          fixtureFetch([], requests),
        ),
      ),
    );
    expect(notes.url).toBeNull();
    expect(notes.text).toContain("No supported GitHub repository");
    expect(requests).toEqual([]);
  });

  test("creates exact-version Socket links for scoped packages", () => {
    expect(socketUrl("@effect/platform-bun", "4.0.0-rc.110")).toBe(
      "https://socket.dev/npm/package/%40effect/platform-bun/overview/4.0.0-rc.110",
    );
  });
});
