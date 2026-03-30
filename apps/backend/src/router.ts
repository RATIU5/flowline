import * as Layer from "effect/Layer";

import { AuthRouteGet } from "./modules/auth";
import { RootRoute } from "./modules/core";
import { MessagesRoute } from "./modules/messages";

export const Routes = Layer.mergeAll(MessagesRoute, RootRoute, AuthRouteGet);
