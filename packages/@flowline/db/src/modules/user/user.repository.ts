import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ServiceMap from "effect/ServiceMap";

import { DatabaseClient, type DatabaseClientError } from "../client";

import type { DB } from "../../types/db";
import type { Selectable } from "../../types/selectable";

export class UserRepository extends ServiceMap.Service<
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
      const db = yield* DatabaseClient;
      return {
        findById(id) {
          return db
            .query((qb) =>
              qb.selectFrom("user").selectAll().where("id", "=", id),
            )
            .pipe(Effect.map((u) => u[0]));
        },
      };
    }),
  );
}
