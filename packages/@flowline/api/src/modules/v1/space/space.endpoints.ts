import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import {
  SpaceCreateErrors,
  SpaceGetByUserErrors,
  SpaceGetErrors,
} from "./space.errors";
import {
  SpaceSchemaGetResponse,
  SpacesSchemaCreateResponse,
  SpacesSchemaGetResponse,
} from "./space.schema";

export const Space = HttpApiGroup.make("space").add(
  HttpApiEndpoint.get("getSpace", "/space/:spaceId", {
    params: { spaceId: Schema.String },
    success: SpaceSchemaGetResponse,
    error: SpaceGetErrors,
  }),
  HttpApiEndpoint.get("getSpacesByUser", "/space/user/:userId", {
    params: { userId: Schema.String },
    success: SpacesSchemaGetResponse,
    error: SpaceGetByUserErrors,
  }),
  HttpApiEndpoint.post("createSpace", "/space", {
    payload: Schema.Struct({ ownerId: Schema.String, name: Schema.String }),
    success: SpacesSchemaCreateResponse,
    error: SpaceCreateErrors,
  }),
);
