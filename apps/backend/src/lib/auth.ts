import { BunFileSystem } from "@effect/platform-bun";
import { FlowlineConfig, DatabaseConfig } from "@flowline/config";
import { DatabasePool } from "@flowline/db/pool";
import { betterAuth } from "better-auth";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const FlowlineConfigLayer = FlowlineConfig.layer.pipe(
  Layer.provide(BunFileSystem.layer),
);
const DatabaseConfigLayer = DatabaseConfig.layer.pipe(
  Layer.provide(FlowlineConfigLayer),
);
const DatabasePoolLayer = Layer.provide(
  DatabasePool.layer,
  DatabaseConfigLayer,
);

const authProgram = Effect.gen(function* () {
  const pool = yield* DatabasePool;
  return betterAuth({
    emailAndPassword: {
      enabled: true,
    },
    database: pool,
  });
});

export const AuthEffect = authProgram;

export default await Effect.runPromise(
  authProgram.pipe(
    Effect.provide(DatabasePoolLayer),
    Effect.catchTag("ConfigError", (e) =>
      Effect.logError(Cause.pretty(Cause.fail(e))).pipe(Effect.orDie),
    ),
  ),
);
