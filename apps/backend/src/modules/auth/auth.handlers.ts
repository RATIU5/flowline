import { AuthHandler } from "@flowline/auth/server";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { HttpServerResponse } from "effect/unstable/http";

import { DBAndConfigLayer } from "../../lib/layers";

export const AuthApiHandlers = AuthHandler.pipe(
  Effect.provide(DBAndConfigLayer),
  Effect.catchTags({
    AuthError: (e) =>
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
    AuthUnknownError: (e) =>
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
    ConfigError: (e) =>
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
    InternalError: (e) =>
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
    RequestParseError: (e) =>
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
    RouteNotFound: (e) =>
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
  }),
);
