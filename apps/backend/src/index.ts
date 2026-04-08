import * as BunHttpServer from "@effect/platform-bun/BunHttpServer";
import * as BunRuntime from "@effect/platform-bun/BunRuntime";
import { AppConfig } from "@flowline/config/app";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/unstable/http/HttpRouter";

import { Routes } from "./router";

const CorsLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const trimmedUrlString = config.general.clientUrl.toString().endsWith("/")
      ? config.general.clientUrl.toString().slice(0, -1)
      : config.general.clientUrl.toString();
    return HttpRouter.cors({
      allowedOrigins: [trimmedUrlString],
      credentials: true,
    });
  }),
);

const RoutesWithCors = Routes.pipe(
  Layer.provide(CorsLive),
  Layer.provide(AppConfig.layer),
);

const ServerLive = BunHttpServer.layer({ port: 3000 });
HttpRouter.serve(RoutesWithCors).pipe(
  Layer.provide(ServerLive),
  Layer.provide(AppConfig.layer),
  Layer.launch,
  Effect.catch((error) =>
    Effect.logFatal("Startup failed", error.message).pipe(
      Effect.andThen(Effect.die(error)),
    ),
  ),
  BunRuntime.runMain,
);
