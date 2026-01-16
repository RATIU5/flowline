import { HttpLayerRouter, HttpServerResponse } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Rpc, RpcGroup, RpcSerialization, RpcServer } from "@effect/rpc";
import { Effect, Layer, Schema } from "effect";

export class Message extends Schema.Class<Message>("Message")({
  message: Schema.String,
}) {}

class MessageRpcs extends RpcGroup.make(
  Rpc.make("HelloRpc", {
    success: Message,
    error: Schema.String,
    payload: {
      foo: Schema.String,
    },
  }),
) {}

const MessageHandlers = MessageRpcs.toLayer({
  HelloRpc: ({ foo }) =>
    Effect.succeed(
      new Message({
        message: `Hello, ${foo}!`,
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
