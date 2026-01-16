import { HttpLayerRouter, HttpServerResponse } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Effect, Layer } from "effect";
import { Message, MessageRpcs } from "@flowline/rpc"

const MessageHandlers = MessageRpcs.toLayer({
  SendMessage: ({ message }) =>
    Effect.succeed(
      new Message({
        message,
      }),
    ),
});

const RootRoute = HttpLayerRouter.add(
  "*",
  "/",
  HttpServerResponse.text("Hello, world!"),
);

const RpcRoute = RpcServer.layerHttpRouter({
  group: MessageRpcs,
  protocol: "websocket",
  path: "/rpc",
}).pipe(
  Layer.provide(MessageHandlers),
  Layer.provide(RpcSerialization.layerJson),
  Layer.provide(HttpLayerRouter.cors()),
);

const Routes = Layer.mergeAll(RpcRoute, RootRoute);

const ServerLive = BunHttpServer.layer({ port: 3000 });
HttpLayerRouter.serve(Routes).pipe(
  Layer.provide(ServerLive),
  Layer.launch,
  BunRuntime.runMain,
);
