import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { DatabaseClient, type DatabaseClientError } from "../client";

import type { DB } from "../../types/db";
import type { Selectable } from "../../types/utils";

export class UserRepository extends Context.Service<
  UserRepository,
  {
    findById: (
      id: string,
    ) => Effect.Effect<Selectable<DB["user"]>, DatabaseClientError>;
  }
>()("@flowline/db/modules/user/user.repository/UserRepository") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = yield* DatabaseClient;
      return {
        findById: (id) =>
          client
            .execute((db) =>
              db.selectFrom("user").selectAll().where("id", "=", id),
            )
            .pipe(Effect.map((u) => u[0])),
      };
    }),
  );
}
