import { HttpRouter } from "effect/unstable/http";

import { AuthApiHandlers } from "./auth.handlers";

export const AuthRouteGet = HttpRouter.add(
  "GET",
  "/api/auth/*",
  AuthApiHandlers,
);
