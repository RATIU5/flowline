import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ServiceMap from "effect/ServiceMap";
import { PostgresDialect, Kysely, type SelectQueryBuilder } from "kysely";

import { type DB } from "../../types/db";
import { DatabasePool } from "../pool/service";
import { DatabaseClientError } from "./errors";

export class DatabaseClient extends ServiceMap.Service<DatabaseClient>()(
  "@flowline/db/client/DatabaseClient",
  {
    make: Effect.gen(function* () {
      const pool = yield* DatabasePool;
      const kysely = new Kysely<DB>({
        dialect: new PostgresDialect({ pool }),
      });
      return {
        // oxlint-disable-next-line typescript/no-explicit-any
        query: <T>(build: (qb: Kysely<DB>) => SelectQueryBuilder<DB, any, T>) =>
          Effect.tryPromise(() => build(kysely).execute()).pipe(
            Effect.catchTag("UnknownError", (e) =>
              Effect.fail(
                new DatabaseClientError({
                  message: e.message,
                  name: e.name ?? "UnkownError",
                  query: build(kysely).compile().sql,
                }),
              ),
            ),
          ),
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
