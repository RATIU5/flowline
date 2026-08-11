import { DatabaseClient } from "@flowline/db/client";
import { SpaceRepository } from "@flowline/db/space";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/unstable/http/HttpRouter";

import { DBAndConfigLayer } from "./lib/layers";
import { AuthRoute } from "./modules/auth";
import { RootRoute } from "./modules/core";
import { MessagesRoute } from "./modules/messages";
import { SpaceApiLive, SpaceService } from "./modules/space/http-v1";

const SpaceStack = SpaceService.layer.pipe(
    Layer.provide(SpaceRepository.layer),
    Layer.provide(DatabaseClient.layer),
    Layer.provide(DBAndConfigLayer),
  ),
  SpaceHttpLive = SpaceApiLive.pipe(HttpRouter.provideRequest(SpaceStack));

export const Routes = Layer.mergeAll(
  MessagesRoute,
  RootRoute,
  AuthRoute,
  SpaceHttpLive,
);
