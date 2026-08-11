import { apiV1 } from "@flowline/api/api";
import * as Effect from "effect/Effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { SpaceService } from "./space.service";

export const SpaceHandlers = HttpApiBuilder.group(
  apiV1.Api,
  "space",
  (handlers) =>
    handlers
      .handle("getSpace", ({ params }) =>
        Effect.gen(function* () {
          const svc = yield* SpaceService;
          return yield* svc.getSpace(params.spaceId);
        }),
      )
      .handle("getSpacesByUser", ({ params }) =>
        Effect.gen(function* () {
          const svc = yield* SpaceService;
          return yield* svc.getSpacesByUser(params.userId);
        }),
      ),
);
