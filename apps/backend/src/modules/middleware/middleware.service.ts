import * as Effect from "effect/Effect";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";
import { HttpApiError } from "effect/unstable/httpapi";

export const ErrorTransformMiddlewareLive = HttpRouter.middleware(
  (httpEffect) =>
    httpEffect.pipe(
      Effect.catchDefect((defect) =>
        HttpApiError.HttpApiSchemaError.is(defect)
          ? Effect.succeed(
              HttpServerResponse.jsonUnsafe(
                {
                  error: defect.message,
                },
                {
                  status: 400,
                },
              ),
            )
          : Effect.die(defect),
      ),
    ),
  { global: true },
);
