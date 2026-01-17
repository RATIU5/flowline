import { HttpLayerRouter, HttpServerResponse } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { type Message, MessageRpcs } from "@flowline/rpc";
import { Effect, Layer, PubSub, Stream } from "effect";

class ChatPubSub extends Effect.Service<ChatPubSub>()("flowline/ChatPubSub", {
  effect: Effect.gen(function* () {
    const pubSub = yield* PubSub.bounded<Message>(2);
    return pubSub;
  }),
}) {}

const MessageHandlers = MessageRpcs.toLayer({
  PublishMessage: (message) =>
    Effect.gen(function* () {
      const pubSub = yield* ChatPubSub;
      yield* pubSub.publish(message);
      return message;
    }),
  SubscribeMessages: () =>
    Stream.unwrap(
      Effect.gen(function* () {
        const pubSub = yield* ChatPubSub;
        const dequeue = yield* pubSub.subscribe;
        return Stream.fromQueue(dequeue);
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
  Layer.provide(ChatPubSub.Default),
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
