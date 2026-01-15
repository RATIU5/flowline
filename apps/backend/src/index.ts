import { HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";

const router = HttpRouter.empty.pipe(
  HttpRouter.get("/", HttpServerResponse.text("Hello, world!")),
);

const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);

const ServerLive = BunHttpServer.layer({ port: 3000 });

Layer.provide(app, ServerLive).pipe(Layer.launch, BunRuntime.runMain);
