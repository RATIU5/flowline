import { betterAuth } from "better-auth";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import { Pool } from "pg";

import { FlowlineConfig } from "../modules/config/index";

const program = Effect.gen(function* () {
  const config = yield* FlowlineConfig;
  return betterAuth({
    database: new Pool({
      database: config.dbName,
      host: config.dbHost,
      password: config.dbPswd.pipe(Redacted.value),
      port: config.dbPort,
      user: config.dbUser,
    }),
  });
}).pipe(
  Effect.provide(FlowlineConfig.layer),
  Effect.catchTag("ConfigError", (e) =>
    Effect.logError(Cause.pretty(Cause.fail(e))),
  ),
);

export default await Effect.runPromise(program);
