import { BunServices } from "@effect/platform-bun";
import { describe, expect, test } from "bun:test";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkVersions } from "../src/dependencies/catalog";

describe("workspace catalog version checker", () => {
  test("checks catalogs only, deduplicates requests, and retains failures and prerelease tags", async () => {
    const directory = await mkdtemp(join(tmpdir(), "catalog-check-"));
    const requests: string[] = [];
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const path = new URL(request.url).pathname;
        requests.push(path);
        return path.includes("missing")
          ? new Response("Not found", { status: 404 })
          : Response.json({ latest: "3.0.0", rc: "4.0.0-rc.111" });
      },
    });
    try {
      const path = join(directory, "package.json");
      await writeFile(
        path,
        JSON.stringify({
          dependencies: { ignored: "1.0.0" },
          workspaces: {
            packages: ["apps/**"],
            catalog: { "@scope/pkg": "^3.0.0" },
            catalogs: {
              effect: { "@scope/pkg": "4.0.0-rc.110", missing: "1.0.0" },
            },
          },
        }),
      );
      const rows = await Effect.runPromise(
        checkVersions(path, server.url.href).pipe(
          Effect.provide(
            Layer.mergeAll(FetchHttpClient.layer, BunServices.layer),
          ),
        ),
      );
      expect(rows).toHaveLength(3);
      expect(requests.sort()).toEqual([
        "/-/package/%40scope%2Fpkg/dist-tags",
        "/-/package/missing/dist-tags",
      ]);
      expect(rows[0]).toMatchObject({
        catalog: "default",
        configured: "^3.0.0",
        latest: "3.0.0",
        rc: "4.0.0-rc.111",
        error: null,
      });
      expect(rows[1].configured).toBe("4.0.0-rc.110");
      expect(rows[2].latest).toBeNull();
      expect(rows[2].error).toContain("404");
    } finally {
      await server.stop(true);
      await rm(directory, { recursive: true, force: true });
    }
  });
});
