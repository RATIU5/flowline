import { HttpLayerRouter, HttpServer } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { DateTime, Effect, Layer, Mailbox, PubSub, Stream } from "effect";

const router = HttpLayerRouter.serve(AllRoutes);
const app = router.pipe(HttpServer.withLogAddress);
const ServerLive = BunHttpServer.layer({ port: 3001 });

// Provide DbLive to AllRoutes (for MessageRpcsLive), then compose with server
const AppLive = Layer.provide(app, ServerLive);
Layer.launch(AppLive).pipe(BunRuntime.runMain);
