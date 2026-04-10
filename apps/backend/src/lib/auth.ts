import { AuthEffect } from "@flowline/auth/shared";
import { AppConfig } from "@flowline/config/app";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { AuthLayer } from "./layers";

const AuthAndConfigLayers = Layer.mergeAll(AppConfig.layer, AuthLayer);

export default await Effect.runPromise(
  AuthEffect.pipe(
    Effect.provide(AuthAndConfigLayers),
    Effect.catchTag("ConfigError", (e) =>
      Effect.logError(Cause.pretty(Cause.fail(e))).pipe(Effect.orDie),
    ),
  ),
);
