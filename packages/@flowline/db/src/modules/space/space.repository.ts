import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { toPatch } from "../../utils";
import { DatabaseClient, type DatabaseClientError } from "../client";
import {
  NoCreateRows,
  NoDeletedRows,
  NoGetRows,
  NoSpacesForUserId,
  NoUpdateRows,
  spaceError,
  TooManyCreateRows,
  TooManyDeletedRows,
  TooManyGetRows,
  TooManyUpdateRows,
  type SpaceRepositoryErrorOf,
} from "./space.errors";

import type { DB, Selectable } from "../../types";
import type {
  InsertResult,
  UpdateResult,
  DeleteResult,
  Nullable,
} from "../../types/utils";

type SpaceRow = Selectable<DB["space"]>;
type SpaceGetCols = Array<keyof Omit<SpaceRow, "id">>;
type SpaceGetResponse = Pick<SpaceRow, "id"> & Partial<Omit<SpaceRow, "id">>;
type SpaceUpdateCols = Nullable<Omit<SpaceRow, "createdAt" | "id" | "spaceId">>;

export class SpaceRepository extends Context.Service<
  SpaceRepository,
  {
    /*
     * Get space data by id
     */
    get: (
      spaceId: string,
      cols?: SpaceGetCols,
    ) => Effect.Effect<
      SpaceGetResponse,
      DatabaseClientError | SpaceRepositoryErrorOf<NoGetRows | TooManyGetRows>
    >;

    /*
     * Get space data by user id
     */
    getByUserId: (
      userId: string,
      cols?: SpaceGetCols,
    ) => Effect.Effect<
      Array<SpaceGetResponse>,
      DatabaseClientError | SpaceRepositoryErrorOf<NoSpacesForUserId>
    >;

    /*
     * Create a new space on the database
     */
    create: (
      ownerId: string,
      spaceName: string,
    ) => Effect.Effect<
      InsertResult,
      | DatabaseClientError
      | SpaceRepositoryErrorOf<NoCreateRows | TooManyCreateRows>
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
        get: (spaceId, cols?: SpaceGetCols) =>
          Effect.gen(function* () {
            const selectCols = cols ?? [];
            const results = yield* client.execute((db) =>
              db
                .selectFrom("space")
                .select(["id", ...selectCols])
                .where("id", "=", spaceId),
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

            return results;
          }).pipe(Effect.map((r) => r[0])),

        getByUserId: (userId, cols?: SpaceGetCols) =>
          Effect.gen(function* () {
            const selectCols = cols ?? [];
            const results = yield* client.execute((db) =>
              db
                .selectFrom("space")
                .select(["space.id", ...selectCols])
                .leftJoin("user", (join) =>
                  join
                    .onRef("space.ownerId", "=", "user.id")
                    .on("user.id", "=", userId),
                ),
            );
            if (results.length === 0) {
              return yield* spaceError(
                new NoSpacesForUserId({
                  message: "No rows returned from space get by user id",
                }),
              );
            }

            return results;
          }),

        create: (ownerId, spaceName) =>
          Effect.gen(function* () {
            const results = yield* client.execute((db) =>
              db.insertInto("space").values({
                name: spaceName,
                ownerId,
              }),
            );

            if (results.length === 0) {
              return yield* spaceError(
                new NoCreateRows({
                  message: "Failed to create new space row",
                }),
              );
            } else if (results.length > 1) {
              return yield* spaceError(
                new TooManyCreateRows({
                  message: "Too many rows returned from space create",
                }),
              );
            }

            return results;
          }).pipe(Effect.map((u) => u[0])),

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
