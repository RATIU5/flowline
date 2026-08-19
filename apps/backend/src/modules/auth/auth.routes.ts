import { HttpRouter } from "effect/unstable/http";

import { AuthLive } from "../../lib/auth";
import { AuthApiHandlers } from "./auth.handlers";

export const AuthRoute = HttpRouter.add(
  "*",
  "/api/auth/*",
  AuthApiHandlers,
).pipe(HttpRouter.provideRequest(AuthLive));
