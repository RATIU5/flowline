import { BunServices } from "@effect/platform-bun";
import { expect, test } from "bun:test";
import { Effect, FileSystem, Schema } from "effect";

import { saveUpdates, Manifest } from "../src/dependencies/catalog";

const entry = {
  name: "demo",
  catalog: "default",
  isDefault: true,
  configured: "1.0.0",
};

test("saving a verified patch adds the selected version while retaining the old mapping", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* fs.makeTempDirectoryScoped();
        const path = `${directory}/package.json`;
        const patchPath = "demo.patch";
        const contents = "example verified patch";
        yield* fs.writeFileString(`${directory}/${patchPath}`, contents);
        yield* fs.writeFileString(
          path,
          '{"workspaces":{"catalog":{"demo":"1.0.0"}},"patchedDependencies":{"demo@1.0.0":"demo.patch"}}',
        );
        yield* saveUpdates(
          path,
          [{ entry, version: "2.0.0" }],
          [
            {
              name: "demo",
              version: "2.0.0",
              oldKey: "demo@1.0.0",
              patchPath,
              contents,
            },
          ],
        );
        const saved = yield* Schema.decodeEffect(
          Schema.fromJsonString(Manifest),
        )(yield* fs.readFileString(path));
        expect(saved.workspaces.catalog?.demo).toBe("2.0.0");
        expect(saved.patchedDependencies).toEqual({
          "demo@1.0.0": "demo.patch",
          "demo@2.0.0": "demo.patch",
        });
      }),
    ).pipe(Effect.provide(BunServices.layer)),
  ));

test("a patch edited after verification blocks every staged update", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* fs.makeTempDirectoryScoped();
        const path = `${directory}/package.json`;
        const before =
          '{"workspaces":{"catalog":{"demo":"1.0.0","other":"1.0.0"}},"patchedDependencies":{"demo@1.0.0":"demo.patch"}}';
        yield* fs.writeFileString(path, before);
        yield* fs.writeFileString(`${directory}/demo.patch`, "changed");
        const error = yield* saveUpdates(
          path,
          [
            { entry: { ...entry, name: "other" }, version: "2.0.0" },
            { entry, version: "2.0.0" },
          ],
          [
            {
              name: "demo",
              version: "2.0.0",
              oldKey: "demo@1.0.0",
              patchPath: "demo.patch",
              contents: "original",
            },
          ],
        ).pipe(Effect.flip);
        expect(String(error)).toContain("changed after verification");
        expect(yield* fs.readFileString(path)).toBe(before);
      }),
    ).pipe(Effect.provide(BunServices.layer)),
  ));
