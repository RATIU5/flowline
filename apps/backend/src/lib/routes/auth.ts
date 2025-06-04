import { Elysia, type Context } from "elysia";
import { auth } from "../auth";

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  }
  context.status(405);
};

export const authRoutes = new Elysia().all("/api/auth/*", betterAuthView);
