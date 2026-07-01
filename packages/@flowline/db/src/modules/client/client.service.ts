import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
  PostgresDialect,
  Kysely,
  type SelectQueryBuilder,
  type InsertQueryBuilder,
  type UpdateQueryBuilder,
} from "kysely";

import { DatabasePool } from "../../modules/pool/pool.service";
import { DatabaseClientError } from "./client.errors";

import type { DB } from "../../types/db";

export class DatabaseClient extends Context.Service<DatabaseClient>()(
  "@flowline/db/client/DatabaseClient",
  {
    make: Effect.gen(function* () {
      const pool = yield* DatabasePool;
      const kysely = new Kysely<DB>({
        dialect: new PostgresDialect({ pool }),
      });
      return {
        execute: <T>(
          build: (qb: Kysely<DB>) =>
            // oxlint-disable-next-line typescript/no-explicit-any
            | SelectQueryBuilder<DB, any, T>
            // oxlint-disable-next-line typescript/no-explicit-any
            | InsertQueryBuilder<DB, any, T>
            // oxlint-disable-next-line typescript/no-explicit-any
            | UpdateQueryBuilder<DB, any, any, T>,
        ) =>
          Effect.tryPromise(() => build(kysely).execute()).pipe(
            Effect.catchTag("UnknownError", (e) =>
              Effect.fail(
                new DatabaseClientError({
                  message: e.message,
                  name: e.name ?? "UnknownError",
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
