import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { DatabaseClient, type DatabaseClientError } from "../client";
import { SpaceRepositoryError } from "./space.errors";

import type {
  InsertResult,
  UpdateResult,
  DeleteResult,
} from "../../types/utils";

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
    ) => Effect.Effect<
      UpdateResult,
      DatabaseClientError | SpaceRepositoryError
    >;

    /*
     * Delete a space from the database
     */
    delete: (
      spaceId: string,
    ) => Effect.Effect<DeleteResult, DatabaseClientError>;
  }
>()("@flowline/db/modules/space/space.repository/SpaceRepository") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = yield* DatabaseClient;
      return {
        create: ({ spaceName, ownerId }) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db.insertInto("space").values({
                name: spaceName,
                ownerId,
              }),
            );

            if (results.length === 0) {
              return yield* new SpaceRepositoryError({
                function: "create",
                name: "NoInsertRows",
                message: "Failed to insert new space row",
              });
            } else if (results.length > 1) {
              return yield* new SpaceRepositoryError({
                function: "create",
                name: "TooManyInsertRows",
                message: "Too many rows returned from space insert",
              });
            }

            return results;
          }).pipe(Effect.map((u) => u[0])),

        updateName: (newName, spaceId) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db
                .updateTable("space")
                .set({
                  name: newName,
                })
                .where("id", "=", spaceId),
            );

            if (results.length === 0) {
              return yield* new SpaceRepositoryError({
                function: "updateName",
                name: "NoInsertRows",
                message: "Failed to update space row",
              });
            } else if (results.length > 1) {
              return yield* new SpaceRepositoryError({
                function: "updateName",
                name: "TooManyInsertRows",
                message: "Too many rows returned from space update",
              });
            }

            return results;
          }).pipe(Effect.map((u) => u[0])),

        delete: (spaceId) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db.deleteFrom("space").where("id", "=", spaceId),
            );

            if (results.length === 0) {
              return yield* new SpaceRepositoryError({
                function: "delete",
                name: "NoDeletedRows",
                message: "Failed to delete space row",
              });
            } else if (results.length > 1) {
              return yield* new SpaceRepositoryError({
                function: "delete",
                name: "TooManyDeletedRows",
                message: "Too many rows returned from space delete",
              });
            }

            return results;
          }).pipe(Effect.map((r) => r[0])),
      };
    }),
  );
}
