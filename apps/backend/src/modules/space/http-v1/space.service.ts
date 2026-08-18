import { apiV1 } from "@flowline/api/api";
import { SpaceRepository } from "@flowline/db/space";
import * as Context from "effect/Context";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export class SpaceService extends Context.Service<
  SpaceService,
  {
    getSpace: (
      spaceId: string,
    ) => Effect.Effect<
      apiV1.SpaceSchemaGetResponse,
      typeof apiV1.SpaceGetErrors.Type
    >;

    getSpacesByUser: (
      userId: string,
    ) => Effect.Effect<
      apiV1.SpacesSchemaGetResponse,
      typeof apiV1.SpaceGetByUserErrors.Type
    >;

    createSpace: (
      ownerId: string,
      spaceName: string,
    ) => Effect.Effect<
      apiV1.SpacesSchemaCreateResponse,
      typeof apiV1.SpaceCreateErrors.Type
    >;
  }
>()("backend/modules/space/space.service/SpaceService") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { get, getByUserId, create } = yield* SpaceRepository;

      return {
        getSpace: (id) =>
          get(id).pipe(
            Effect.map((r) => ({
              data: {
                ...r,
                createdAt: r.createdAt
                  ? DateTime.fromDateUnsafe(r.createdAt)
                  : undefined,
              },
            })),
            Effect.catchTags({
              SpaceRepositoryError: (e) =>
                e.name === "NoGetRows"
                  ? Effect.fail(
                      new apiV1.SpaceNotFound({
                        message: "No spaces found",
                      }),
                    )
                  : Effect.fail(
                      new apiV1.SpaceConflict({
                        message: "Multiple spaces found",
                      }),
                    ),
              DatabaseClientError: (e) =>
                Effect.logWarning(e.message).pipe(
                  Effect.andThen(
                    Effect.fail(
                      new apiV1.SpaceInternalError({
                        message: "Internal server error",
                      }),
                    ),
                  ),
                ),
            }),
          ),

        getSpacesByUser: (userId) =>
          getByUserId(userId).pipe(
            Effect.map((r) => ({
              data: r.map((r2) => ({
                ...r2,
                createdAt: r2.createdAt
                  ? DateTime.fromDateUnsafe(r2.createdAt)
                  : undefined,
              })),
            })),
            Effect.catchTags({
              SpaceRepositoryError: (e) =>
                e.name === "NoSpacesForUserId"
                  ? Effect.fail(
                      new apiV1.NoSpacesForUserError({
                        message: "No spaces for user found",
                      }),
                    )
                  : Effect.fail(
                      new apiV1.SpaceInternalError({
                        message: "Unknown spaces for user found error",
                      }),
                    ),
              DatabaseClientError: (e) =>
                Effect.logWarning(e.message).pipe(
                  Effect.andThen(
                    Effect.fail(
                      new apiV1.SpaceInternalError({
                        message: "Internal server error",
                      }),
                    ),
                  ),
                ),
            }),
          ),

        createSpace: (ownerId, spaceName) =>
          create(ownerId, spaceName).pipe(
            Effect.map((r) => ({
              data: { id: `${r.insertId}` },
            })),
            Effect.catchTags({
              SpaceRepositoryError: (e) =>
                e.name === "MissingPayload"
                  ? Effect.fail(
                      new apiV1.MissingPayload({
                        message: "Invalid payload for endpoint",
                      }),
                    )
                  : Effect.fail(
                      new apiV1.SpaceInternalError({
                        message: "Unknown spaces for user found error",
                      }),
                    ),
              DatabaseClientError: (e) =>
                Effect.logWarning(e.message).pipe(
                  Effect.andThen(
                    Effect.fail(
                      new apiV1.SpaceInternalError({
                        message: "Internal server error",
                      }),
                    ),
                  ),
                ),
            }),
          ),
      };
    }),
  );
}
