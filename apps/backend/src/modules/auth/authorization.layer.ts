import { apiV1 } from "@flowline/api/api";
import { Auth } from "@flowline/auth/shared";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { HttpServerRequest } from "effect/unstable/http";

/**
 * Server implementation of the `Authorization` middleware: resolves the
 * better-auth session from the request cookies and provides `CurrentUser` to
 * every endpoint behind it.
 */
export const AuthorizationLive = Layer.effect(
  apiV1.Authorization,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const session = yield* Effect.tryPromise({
          try: () =>
            auth.api.getSession({ headers: new Headers(request.headers) }),
          catch: () =>
            new apiV1.Unauthorized({ message: "Session lookup failed" }),
        });

        if (!session) {
          return yield* new apiV1.Unauthorized({
            message: "Not authenticated",
          });
        }

        return yield* Effect.provideService(httpEffect, apiV1.CurrentUser, {
          id: session.user.id,
        });
      });
  }),
);
