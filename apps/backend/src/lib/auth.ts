import { BunFileSystem } from "@effect/platform-bun";
import { FlowlineConfig } from "@flowline/config";
import { DatabaseConfig } from "@flowline/db/config";
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
    database: pool,
  });
}).pipe(
  Effect.provide(DatabasePoolLayer),
  Effect.catchTag("ConfigError", (e) =>
    Effect.logError(Cause.pretty(Cause.fail(e))).pipe(Effect.orDie),
  ),
  Effect.catchTag("PlatformError", (e) =>
    Effect.logError(Cause.pretty(Cause.fail(e))).pipe(Effect.orDie),
  ),
);

export default await Effect.runPromise(authProgram);
