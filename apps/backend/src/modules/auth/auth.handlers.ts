import { AuthHandler } from "@flowline/auth/server";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { HttpServerResponse } from "effect/unstable/http";

import { AuthLayer } from "../../lib/layers";

export const AuthApiHandlers = AuthHandler.pipe(
  Effect.provide(AuthLayer),
  Effect.catchTag("AuthError", (e) =>
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
  Effect.catchTag("AuthUnknownError", (e) =>
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
