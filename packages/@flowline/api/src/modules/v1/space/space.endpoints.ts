import * as Schema from "effect/Schema";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import {
  SpaceConflict,
  SpaceInternalError,
  SpaceNotFound,
} from "./space.errors";
import { SpaceSchemaGetResponse } from "./space.schema";

export const SpaceErrors = Schema.Union([
  SpaceNotFound,
  SpaceConflict,
  SpaceInternalError,
]);

export const Space = HttpApiGroup.make("space").add(
  HttpApiEndpoint.get("getSpace", "/space", {
    success: SpaceSchemaGetResponse,
    error: SpaceErrors,
  }),
);
