import { BunServices } from "@effect/platform-bun";
import { describe, expect, test } from "bun:test";
import { Effect, Layer, Schema } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  checkVersions,
  classifyVersion,
  readEntries,
  saveUpdates,
} from "../src/dependencies/catalog";

const entry = {
  catalog: "default",
  isDefault: true,
  name: "demo",
  configured: "^1.0.0",
};
const runSave = (path: string, updates: Parameters<typeof saveUpdates>[1]) =>
  Effect.runPromise(
    saveUpdates(path, updates).pipe(Effect.provide(BunServices.layer)),
  );
async function fixture(
  manifest: Schema.Json,
  body: (path: string) => Promise<void>,
) {
  const directory = await mkdtemp(join(tmpdir(), "catalog-wizard-"));
  const path = join(directory, "package.json");
  try {
    await writeFile(path, JSON.stringify(manifest, null, 2) + "\n");
    await body(path);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe("catalog comparisons", () => {
  test("compares complete ranges and preserves prerelease channels without downgrades", () => {
    const classify = (configured: string, tags: Record<string, string>) =>
      classifyVersion({ ...entry, configured }, tags);
    expect(classify("^1.0.0", { latest: "1.0.0" }).status).toBe("current");
    expect(classify("~1.0.0", { latest: "2.0.0" }).status).toBe("outdated");
    expect(
      classify("4.0.0-rc.110", { latest: "3.0.0", rc: "4.0.0-rc.111" }).target,
    ).toBe("4.0.0-rc.111");
    expect(
      classify("4.0.0-beta.1", { latest: "4.0.0", beta: "4.0.0-beta.2" })
        .target,
    ).toBe("4.0.0");
    expect(classify("5.0.0", { latest: "4.0.0" })).toMatchObject({
      status: "ahead",
      target: null,
    });
    expect(classify(">=1.0.0 <3", { latest: "2.0.0" }).status).toBe("unknown");
    expect(classify("workspace:*", { latest: "2.0.0" }).status).toBe("unknown");
    expect(classify("1.0.0", { latest: "bad" }).status).toBe("unknown");
  });
  test("checks only catalogs, deduplicates HTTP, reports failures", async () => {
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
      await fixture(
        {
          dependencies: { ignored: "1.0.0" },
          workspaces: {
            catalog: { "@scope/pkg": "^3.0.0" },
            catalogs: {
              default: { "@scope/pkg": "4.0.0-rc.110", missing: "1.0.0" },
            },
          },
        },
        async (path) => {
          const rows = await Effect.runPromise(
            checkVersions(path, server.url.href).pipe(
              Effect.provide(
                Layer.mergeAll(BunServices.layer, FetchHttpClient.layer),
              ),
            ),
          );
          expect(requests.sort()).toEqual([
            "/-/package/%40scope%2Fpkg/dist-tags",
            "/-/package/missing/dist-tags",
          ]);
          expect(rows[0]).toMatchObject({ isDefault: true, status: "current" });
          expect(rows[1]).toMatchObject({
            isDefault: false,
            status: "outdated",
            target: "4.0.0-rc.111",
          });
          expect(rows[2]).toMatchObject({ status: "error", target: null });
          expect(rows[2]!.error).toContain("404");
        },
      );
    } finally {
      await server.stop(true);
    }
  });
});

describe("catalog saves", () => {
  test("preserves unrelated JSON and ranges and distinguishes a named default catalog", async () => {
    const manifest = {
      custom: { retained: [1, 2] },
      dependencies: { untouched: "1.0.0" },
      workspaces: {
        packages: ["apps/*"],
        catalog: { demo: "^1.0.0" },
        catalogs: { default: { demo: "~1.0.0" } },
      },
    };
    await fixture(manifest, async (path) => {
      await runSave(
        path,
        readEntries(manifest).map((entry) => ({ entry, version: "2.0.0" })),
      );
      const updated = await Effect.runPromise(
        Schema.decodeEffect(Schema.fromJsonString(Schema.Json))(
          await readFile(path, "utf8"),
        ),
      );
      expect(updated).toEqual({
        ...manifest,
        workspaces: {
          ...manifest.workspaces,
          catalog: { demo: "^2.0.0" },
          catalogs: { default: { demo: "~2.0.0" } },
        },
      });
    });
  });
  test("rejects changes since scan before writing anything", async () => {
    await fixture(
      { workspaces: { catalog: { demo: "^1.0.0", other: "1.0.1" } } },
      async (path) => {
        const before = await readFile(path, "utf8");
        await expect(
          runSave(path, [
            { entry, version: "2.0.0" },
            {
              entry: { ...entry, name: "other", configured: "1.0.0" },
              version: "2.0.0",
            },
          ]),
        ).rejects.toThrow("changed since the scan");
        expect(await readFile(path, "utf8")).toBe(before);
      },
    );
  });
  test("rejects patch migrations without modifying the manifest", async () => {
    await fixture(
      {
        workspaces: { catalog: { demo: "^1.0.0" } },
        patchedDependencies: { "demo@1.0.0": "patches/demo.patch" },
      },
      async (path) => {
        const before = await readFile(path, "utf8");
        await expect(
          runSave(path, [{ entry, version: "2.0.0" }]),
        ).rejects.toThrow("needs patch verification");
        expect(await readFile(path, "utf8")).toBe(before);
      },
    );
  });
});
