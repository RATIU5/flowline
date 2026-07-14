import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { SpaceSchemaGetResponse } from "./space.schema";

export const Space = HttpApiGroup.make("space").add(
  HttpApiEndpoint.get("getSpace", "/space", {
    success: SpaceSchemaGetResponse,
  }),
);
