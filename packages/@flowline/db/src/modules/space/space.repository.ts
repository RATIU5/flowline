import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { toPatch } from "../../utils";
import { DatabaseClient, type DatabaseClientError } from "../client";
import {
  NoCreateRows,
  NoDeletedRows,
  NoGetRows,
  NoUpdateRows,
  spaceError,
  TooManyDeletedRows,
  TooManyGetRows,
  TooManyUpdateRows,
  type SpaceRepositoryErrorOf,
} from "./space.errors";

import type { DB, Selectable } from "../../types";
import type { UpdateResult, DeleteResult, Nullable } from "../../types/utils";

type SpaceRow = Selectable<DB["space"]>;
type SpaceUpdateCols = Nullable<Omit<SpaceRow, "createdAt" | "id" | "spaceId">>;

export class SpaceRepository extends Context.Service<
  SpaceRepository,
  {
    /*
     * Get space data by id
     */
    get: (
      spaceId: string,
    ) => Effect.Effect<
      SpaceRow,
      DatabaseClientError | SpaceRepositoryErrorOf<NoGetRows | TooManyGetRows>
    >;

    /*
     * Get space data by user id
     */
    getByUserId: (
      userId: string,
    ) => Effect.Effect<Array<SpaceRow>, DatabaseClientError>;

    /*
     * Create a new space on the database
     */
    create: (
      ownerId: string,
      spaceName: string,
    ) => Effect.Effect<
      SpaceRow,
      DatabaseClientError | SpaceRepositoryErrorOf<NoCreateRows>
    >;

    /*
     * Update a space's name on the database
     */
    update: (
      spaceId: string,
      cols: SpaceUpdateCols,
    ) => Effect.Effect<
      UpdateResult,
      | DatabaseClientError
      | SpaceRepositoryErrorOf<NoUpdateRows | TooManyUpdateRows>
    >;

    /*
     * Delete a space from the database
     */
    delete: (
      spaceId: string,
    ) => Effect.Effect<
      DeleteResult,
      | DatabaseClientError
      | SpaceRepositoryErrorOf<NoDeletedRows | TooManyDeletedRows>
    >;
  }
>()("@flowline/db/modules/space/space.repository/SpaceRepository") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = yield* DatabaseClient;
      return {
        get: (spaceId) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db.selectFrom("space").selectAll().where("id", "=", spaceId),
            );

            if (results.length === 0) {
              return yield* spaceError(
                new NoGetRows({ message: "Failed to get space row" }),
              );
            } else if (results.length > 1) {
              return yield* spaceError(
                new TooManyGetRows({
                  message: "Too many rows returned from space get",
                }),
              );
            }

            return results[0];
          }),

        getByUserId: (userId) =>
          client.execute((db) =>
            db
              .selectFrom("space")
              .selectAll()
              .where("space.ownerId", "=", userId),
          ),

        create: (ownerId, spaceName) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db
                .insertInto("space")
                .values({ name: spaceName, ownerId })
                .returningAll(),
            );

            if (results.length === 0) {
              return yield* spaceError(
                new NoCreateRows({
                  message: "Failed to create new space row",
                }),
              );
            }

            return results[0];
          }),

        update: (spaceId, cols) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db
                .updateTable("space")
                .set(toPatch(cols))
                .where("id", "=", spaceId),
            );

            if (results.length === 0) {
              return yield* spaceError(
                new NoUpdateRows({
                  message: "Failed to update space row",
                }),
              );
            } else if (results.length > 1) {
              return yield* spaceError(
                new TooManyUpdateRows({
                  message: "Too many rows returned from space update",
                }),
              );
            }

            return results;
          }).pipe(Effect.map((u) => u[0])),

        delete: (spaceId) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db.deleteFrom("space").where("id", "=", spaceId),
            );

            if (results.length === 0) {
              return yield* spaceError(
                new NoDeletedRows({
                  message: "Failed to delete space row",
                }),
              );
            } else if (results.length > 1) {
              return yield* spaceError(
                new TooManyDeletedRows({
                  message: "Too many rows returned from space delete",
                }),
              );
            }

            return results;
          }).pipe(Effect.map((r) => r[0])),
      };
    }),
  );
}
