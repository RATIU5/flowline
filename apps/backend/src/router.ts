import * as Layer from "effect/Layer";

import { AuthRoute } from "./modules/auth";
import { RootRoute } from "./modules/core";
import { MessagesRoute } from "./modules/messages";
import { SpaceApiLive } from "./modules/space/http-v1";

export const Routes = Layer.mergeAll(
  MessagesRoute,
  RootRoute,
  AuthRoute,
  SpaceApiLive,
);
