import { HttpRouter } from "effect/unstable/http";

import { AuthApiHandlers } from "./auth.handlers";

export const AuthRoute = HttpRouter.add("*", "/api/auth/*", AuthApiHandlers);
