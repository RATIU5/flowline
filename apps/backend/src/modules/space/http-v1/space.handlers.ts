import type { Selectable, DB } from "@flowline/db/types";

import { apiV1 } from "@flowline/api/api";
import { SpaceRepository } from "@flowline/db/space";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

const toSpace = (row: Selectable<DB["space"]>) =>
  new apiV1.Space({
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    createdAt: DateTime.fromDateUnsafe(row.createdAt),
  });

export const SpaceHandlers = HttpApiBuilder.group(
  apiV1.Api,
  "space",
  Effect.fn(function* (handlers) {
    const { get, getByUserId, create } = yield* SpaceRepository;

    return handlers
      .handle("listSpaces", () =>
        Effect.gen(function* () {
          const user = yield* apiV1.CurrentUser;
          const rows = yield* getByUserId(user.id);
          return rows.map(toSpace);
        }).pipe(Effect.orDie),
      )
      .handle("getSpace", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* apiV1.CurrentUser;
          const row = yield* get(params.spaceId).pipe(
            Effect.catchReason(
              "SpaceRepositoryError",
              "NoGetRows",
              () =>
                new apiV1.SpaceNotFound({
                  message: `No space with id ${params.spaceId}`,
                }),
              Effect.die,
            ),
            Effect.catchTag("DatabaseClientError", Effect.die),
          );

          if (row.ownerId !== user.id) {
            return yield* new apiV1.SpaceNotFound({
              message: `No space with id ${params.spaceId}`,
            });
          }

          return toSpace(row);
        }),
      )
      .handle("createSpace", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* apiV1.CurrentUser;
          const row = yield* create(user.id, payload.name);
          return toSpace(row);
        }).pipe(Effect.orDie),
      );
  }),
);
