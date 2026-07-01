import { BunFileSystem } from "@effect/platform-bun";
import { AppConfig } from "@flowline/config/app";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { defineConfig } from "kysely-ctl";
import { join } from "node:path";

import { DatabasePool } from "./src/modules/pool/pool.service";

const backendEnv = join(import.meta.dirname, "../../../apps/backend/.env");

const FlowlineConfigLayer = AppConfig.layer.pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromDotEnv({
        path: backendEnv,
      }),
    ),
  ),
  Layer.provide(BunFileSystem.layer),
);

const DatabasePoolLayer = Layer.provide(
  DatabasePool.layer,
  FlowlineConfigLayer,
);

const runtime = ManagedRuntime.make(DatabasePoolLayer);
const pool = await runtime.runPromise(DatabasePool);

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
