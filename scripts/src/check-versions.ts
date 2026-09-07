import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, Layer } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { FetchHttpClient } from "effect/unstable/http";
import { fileURLToPath } from "node:url";

import { checkVersions } from "./dependencies/catalog";
import { dashboard, wizard } from "./dependencies/wizard";

export { checkVersions, readEntries } from "./dependencies/catalog";

const command = Command.make(
  "check-versions",
  {
    json: Flag.boolean("json").pipe(
      Flag.withDefault(false),
      Flag.withDescription("Print a machine-readable report without prompting"),
    ),
    report: Flag.boolean("report").pipe(
      Flag.withDefault(false),
      Flag.withDescription(
        "Print the dashboard and versions without prompting",
      ),
    ),
    registry: Flag.string("registry").pipe(
      Flag.withDefault("https://registry.npmjs.org"),
      Flag.withDescription("Registry URL for public package metadata"),
    ),
  },
  Effect.fn(function* ({ json, report, registry }) {
    const path = fileURLToPath(new URL("../../package.json", import.meta.url));
    if (!json && !report && process.stdin.isTTY && process.stdout.isTTY) {
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* Effect.acquireRelease(
            Effect.sync(() => {
              process.stdout.write("\x1b[?1049h\x1b[H");
            }),
            () =>
              Effect.sync(() => {
                process.stdout.write("\x1b[?25h\x1b[?1049l");
              }),
          );
          yield* wizard(path, registry);
        }),
      );
      return;
    }
    const rows = yield* checkVersions(path, registry);
    if (json) {
      yield* Console.log(JSON.stringify(rows, null, 2));
    } else {
      yield* Console.log(dashboard(rows, 0));
      yield* Console.table(rows);
    }
    if (rows.some((row) => row.error !== null)) {
      yield* Effect.sync(() => {
        process.exitCode = 1;
      });
    }
  }),
).pipe(Command.withDescription("Explore and update root workspace catalogs"));

if (import.meta.main) {
  command.pipe(
    Command.run({ version: "2.0.0" }),
    Effect.catchTag("QuitError", () =>
      Console.log("\nWizard closed. Unsaved selections were discarded."),
    ),
    Effect.provide(Layer.mergeAll(FetchHttpClient.layer, BunServices.layer)),
    BunRuntime.runMain,
  );
}
