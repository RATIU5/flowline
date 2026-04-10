import { BetterAuthError as ba_BetterAuthError } from "better-auth";
import * as Effect from "effect/Effect";
import { HttpServerResponse } from "effect/unstable/http";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";

import { AuthEffect } from "../../lib/auth";
import { AuthError, AuthUnknownError } from "../shared/auth.errors";

export const AuthHandler = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const webRequest = yield* HttpServerRequest.toWeb(request);
  const auth = yield* AuthEffect;
  const handler = yield* Effect.tryPromise({
    try: () => auth.handler(webRequest),
    catch: (e) => {
      if (e instanceof ba_BetterAuthError) {
        return new AuthError({
          name: e.name,
          message: e.message,
        });
      }
      return new AuthUnknownError({
        name: "UNKNOWN_BETTER_AUTH_ERROR",
        message: "An unknown auth error occurred",
      });
    },
  });
  return HttpServerResponse.fromWeb(handler);
});
