import { apiV1 } from "@flowline/api/api";
import { DatabaseClient } from "@flowline/db/client";
import { SpaceRepository } from "@flowline/db/space";
import * as Layer from "effect/Layer";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { AuthLive } from "../../../lib/auth";
import { DBAndConfigLayer } from "../../../lib/layers";
import { AuthorizationLive } from "../../auth/authorization.layer";
import { SpaceHandlers } from "./space.handlers";

export const SpaceApiLive = HttpApiBuilder.layer(apiV1.Api, {
  openapiPath: "/api/v1/openapi.json",
}).pipe(
  Layer.provide(SpaceHandlers),
  Layer.provide(AuthorizationLive),
  Layer.provide(AuthLive),
  Layer.provide(SpaceRepository.layer),
  Layer.provide(DatabaseClient.layer),
  Layer.provide(DBAndConfigLayer),
);
