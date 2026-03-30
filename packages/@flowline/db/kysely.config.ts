import { BunFileSystem } from "@effect/platform-bun";
import { FlowlineConfig, DatabaseConfig } from "@flowline/config";
import { Cause, Effect, Layer } from "effect";
import * as ConfigProvider from "effect/ConfigProvider";
import { defineConfig } from "kysely-ctl";

import { DatabasePool } from "./src/modules/pool/pool.service";

const FlowlineConfigLayer = FlowlineConfig.layer.pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromDotEnv({
        path: `${import.meta.url}/../../../apps/backend/.env`,
      }),
    ),
  ),
  Layer.provide(BunFileSystem.layer),
);
const DatabaseConfigLayer = DatabaseConfig.layer.pipe(
  Layer.provide(FlowlineConfigLayer),
);
const DatabasePoolLayer = Layer.provide(
  DatabasePool.layer,
  DatabaseConfigLayer,
);

const pool = await Effect.gen(function* () {
  return yield* DatabasePool;
}).pipe(
  Effect.provide(DatabasePoolLayer),
  Effect.catchTag("PlatformError", (e) =>
    Effect.logError(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(Effect.succeed(undefined)),
    ),
  ),
  Effect.catchTag("ConfigError", (e) =>
    Effect.logError(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(Effect.succeed(undefined)),
    ),
  ),
  Effect.runPromise,
);

export default defineConfig({
  dialect: "pg",
  dialectConfig: { pool },
  migrations: {
    migrationFolder: "migrations",
  },
  seeds: {
    seedFolder: "seeds",
  },
});
