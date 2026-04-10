import { BunFileSystem } from "@effect/platform-bun";
import { AppConfig } from "@flowline/config/app";
import { Cause, Effect, Layer } from "effect";
import * as ConfigProvider from "effect/ConfigProvider";
import { defineConfig } from "kysely-ctl";

import { DatabasePool } from "./src/modules/pool/pool.service";

const FlowlineConfigLayer = AppConfig.layer.pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromDotEnv({
        path: `${import.meta.url}/../../../apps/backend/.env`,
      }),
    ),
  ),
  Layer.provide(BunFileSystem.layer),
);
const DatabasePoolLayer = Layer.provide(
  DatabasePool.layer,
  FlowlineConfigLayer,
);

const pool = await Effect.service(DatabasePool).pipe(
  Effect.provide(DatabasePoolLayer),
  Effect.catchTag("PlatformError", (e) =>
    Effect.logError(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(Effect.void),
    ),
  ),
  Effect.catchTag("ConfigError", (e) =>
    Effect.logError(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(Effect.void),
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
