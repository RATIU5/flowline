import { HttpLayerRouter, HttpServerResponse } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";

const router = HttpLayerRouter.add(
  "*",
  "/",
  HttpServerResponse.text("Hello, world!"),
);

const ServerLive = BunHttpServer.layer({ port: 3000 });

HttpLayerRouter.serve(router).pipe(
  Layer.provide(ServerLive),
  Layer.launch,
  BunRuntime.runMain,
);
