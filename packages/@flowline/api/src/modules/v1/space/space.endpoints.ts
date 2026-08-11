import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { SpaceGetByUserErrors, SpaceGetErrors } from "./space.errors";
import {
  SpaceSchemaGetResponse,
  SpacesSchemaGetResponse,
} from "./space.schema";

export const Space = HttpApiGroup.make("space").add(
  HttpApiEndpoint.get("getSpace", "/space", {
    params: { spaceId: Schema.String },
    success: SpaceSchemaGetResponse,
    error: SpaceGetErrors,
  }),
  HttpApiEndpoint.get("getSpacesByUser", "/space/:userId", {
    params: { userId: Schema.String },
    success: SpacesSchemaGetResponse,
    error: SpaceGetByUserErrors,
  }),
);
