import { BunFileSystem } from "@effect/platform-bun";
import { FlowlineConfig } from "@flowline/config";
import { Cause, Effect, Layer, Redacted } from "effect";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";

const Config = FlowlineConfig.layer.pipe(Layer.provide(BunFileSystem.layer));

const config = await Effect.gen(function* () {
  return yield* FlowlineConfig;
}).pipe(
  Effect.provide(Config),
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
  Effect.map((c) =>
    c
      ? {
          ...c,
          betterAuthSecret: Redacted.value(c.betterAuthSecret),
          dbPswd: Redacted.value(c.dbPswd),
        }
      : undefined,
  ),
  Effect.runPromise,
);

export default defineConfig({
  dialect: "pg",
  dialectConfig: {
    pool: new Pool({
      database: config?.dbName,
      host: config?.dbHost,
      password: config?.dbPswd,
      port: config?.dbPort,
      user: config?.dbUser,
    }),
  },
  migrations: {
    migrationFolder: "migrations",
  },
  seeds: {
    seedFolder: "seeds",
  },
});
