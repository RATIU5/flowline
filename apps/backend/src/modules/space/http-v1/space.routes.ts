import { apiV1 } from "@flowline/api/api";
import * as Layer from "effect/Layer";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { SpaceHandlers } from "./space.handlers";

export const SpaceApiLive = HttpApiBuilder.layer(apiV1.Api).pipe(
  Layer.provide(SpaceHandlers),
);
