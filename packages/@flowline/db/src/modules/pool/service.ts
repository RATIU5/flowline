import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as ServiceMap from "effect/ServiceMap";
import { Pool } from "pg";

import { DatabaseConfig } from "../config";
import { DatabasePoolEndError } from "./errors";

export class DatabasePool extends ServiceMap.Service<DatabasePool, Pool>()(
  "@flowline/db/modules/pool/service/DatabasePool",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const config = yield* DatabaseConfig;
      return yield* Effect.acquireRelease(
        Effect.sync(
          () =>
            new Pool({
              ...config,
              password: Redacted.value(config.password),
            }),
        ),
        (pool, exit) =>
          Effect.gen(function* () {
            yield* Exit.isSuccess(exit)
              ? Console.debug(`Closing pool (success)`)
              : Console.debug(`Closing pool (failure)`);
            yield* Effect.tryPromise({
              try: () => pool.end(),
              catch: (e) =>
                new DatabasePoolEndError({
                  error: e,
                  message: "Failed to end pool",
                }),
            }).pipe(Effect.orDie);
          }),
      );
    }),
  );
}
