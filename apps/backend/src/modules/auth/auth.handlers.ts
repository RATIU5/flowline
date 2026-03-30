import { BetterAuthError as ba_BetterAuthError } from "better-auth";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { HttpServerResponse } from "effect/unstable/http";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";

import { AuthEffect } from "../../lib/auth";
import { DatabasePoolLayer } from "../../lib/layers";
import { BetterAuthError, BetterAuthUnknownError } from "./auth.errors";

export const AuthApiHandlers = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const webRequest = yield* HttpServerRequest.toWeb(request);
  const auth = yield* AuthEffect;
  const handler = yield* Effect.tryPromise({
    try: () => auth.handler(webRequest),
    catch: (e) => {
      if (e instanceof ba_BetterAuthError) {
        return new BetterAuthError({
          name: e.name,
          message: e.message,
        });
      }
      return new BetterAuthUnknownError({
        name: "UNKNOWN_BETTER_AUTH_ERROR",
        message: "An unknown Better Auth error occurred",
      });
    },
  });
  return HttpServerResponse.fromWeb(handler);
}).pipe(
  Effect.provide(DatabasePoolLayer),
  Effect.catchTag("BetterAuthError", (e) =>
    Effect.logDebug(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(
        Effect.succeed(
          HttpServerResponse.jsonUnsafe(
            { message: e.message },
            { status: 500 },
          ),
        ),
      ),
    ),
  ),
  Effect.catchTag("BetterAuthUnknownError", (e) =>
    Effect.logDebug(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(
        Effect.succeed(
          HttpServerResponse.jsonUnsafe(
            { message: e.message },
            { status: 500 },
          ),
        ),
      ),
    ),
  ),
  Effect.catchTag("ConfigError", (e) =>
    Effect.logDebug(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(
        Effect.succeed(
          HttpServerResponse.jsonUnsafe(
            { message: e.message },
            { status: 500 },
          ),
        ),
      ),
    ),
  ),
  Effect.catchTag("InternalError", (e) =>
    Effect.logDebug(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(
        Effect.succeed(
          HttpServerResponse.jsonUnsafe(
            { message: e.message },
            { status: 500 },
          ),
        ),
      ),
    ),
  ),
  Effect.catchTag("RequestParseError", (e) =>
    Effect.logDebug(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(
        Effect.succeed(
          HttpServerResponse.jsonUnsafe(
            { message: e.message },
            { status: 400 },
          ),
        ),
      ),
    ),
  ),
  Effect.catchTag("RouteNotFound", (e) =>
    Effect.logDebug(Cause.pretty(Cause.fail(e))).pipe(
      Effect.andThen(
        Effect.succeed(
          HttpServerResponse.jsonUnsafe(
            { message: e.message },
            { status: 404 },
          ),
        ),
      ),
    ),
  ),
);
