import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { Authorization } from "../authorization";
import { SpaceNotFound } from "./space.errors";
import { Space } from "./space.schema";

/**
 * Every endpoint acts on behalf of the authenticated caller, so no endpoint
 * takes a user id from the request.
 */
export const SpaceGroup = HttpApiGroup.make("space")
  .add(
    HttpApiEndpoint.get("listSpaces", "/space", {
      success: Schema.Array(Space),
    }),
    HttpApiEndpoint.get("getSpace", "/space/:spaceId", {
      params: { spaceId: Schema.String },
      success: Space,
      error: SpaceNotFound,
    }),
    HttpApiEndpoint.post("createSpace", "/space", {
      payload: Schema.Struct({ name: Schema.NonEmptyString }),
      success: Space,
    }),
  )
  .middleware(Authorization);
