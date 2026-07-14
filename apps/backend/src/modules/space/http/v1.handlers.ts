import { apiV1 } from "@flowline/api/api";
import { SpaceRepository } from "@flowline/db/space";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

export const SpaceHandlers = HttpApiBuilder.group(
  apiV1.Api,
  "space",
  (handlers) =>
    handlers.handle("getSpace", () =>
      Effect.gen(function* () {
        const repo = yield* SpaceRepository;

        return yield* repo.get("test");
      }).pipe(Effect.provide(SpaceRepository.layer)),
    ),
);
