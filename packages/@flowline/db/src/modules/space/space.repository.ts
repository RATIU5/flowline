import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { DatabaseClient, type DatabaseClientError } from "../client";

import type { InsertResult, UpdateResult } from "../../types/utils";

export class SpaceRepository extends Context.Service<
  SpaceRepository,
  {
    /*
     * Create a new space on the database
     */
    create: ({
      spaceName,
      ownerId,
    }: {
      spaceName: string;
      ownerId: string;
    }) => Effect.Effect<InsertResult, DatabaseClientError>;

    /*
     * Update a space's name on the database
     */
    updateName: (
      newName: string,
      spaceId: string,
    ) => Effect.Effect<UpdateResult, DatabaseClientError>;
  }
>()("@flowline/db/modules/space/space.repository/SpaceRepository") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = yield* DatabaseClient;
      return {
        create: ({ spaceName, ownerId }) =>
          client
            .execute((db) =>
              db.insertInto("space").values({
                name: spaceName,
                ownerId,
              }),
            )
            .pipe(Effect.map((u) => u[0])),

        updateName: (newName, spaceId) =>
          client
            .execute((db) =>
              db
                .updateTable("space")
                .set({
                  name: newName,
                })
                .where("id", "=", spaceId),
            )
            .pipe(Effect.map((u) => u[0])),
      };
    }),
  );
}
