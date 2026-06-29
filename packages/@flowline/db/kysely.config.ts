import { BunFileSystem } from "@effect/platform-bun";
import { AppConfig } from "@flowline/config/app";
import { Context, Effect, Layer } from "effect";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Scope from "effect/Scope";
import { defineConfig } from "kysely-ctl";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DatabasePool } from "./src/modules/pool/pool.service";

const scope = Effect.runSync(Scope.make());

const FlowlineConfigLayer = AppConfig.layer.pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromDotEnv({
        path: join(
          dirname(fileURLToPath(import.meta.url)),
          "../../../apps/backend/.env",
        ),
      }),
    ),
  ),
  Layer.provide(BunFileSystem.layer),
);
const DatabasePoolLayer = Layer.provide(
  DatabasePool.layer,
  FlowlineConfigLayer,
);

const context = await Layer.build(DatabasePoolLayer).pipe(
  Scope.provide(scope),
  Effect.runPromise,
);

const pool = Context.get(context, DatabasePool);

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
