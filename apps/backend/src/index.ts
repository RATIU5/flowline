import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Message, MessageRpcs } from "@flowline/rpc";
import { Effect, Layer, PubSub, ServiceMap, Stream } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { HttpServerResponse } from "effect/unstable/http";

class ChatPubSub extends ServiceMap.Service<ChatPubSub>()(
  "flowline/ChatPubSub",
  {
    make: Effect.gen(function* () {
      const pubSub = yield* PubSub.bounded<Message>(2);
      return pubSub;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}

const MessageHandlers = MessageRpcs.toLayer({
  PublishMessage: Effect.fn("flowline/MessageHandlers/PublishMessage")(
    function* (message) {
      const chatService = yield* ChatPubSub;
      yield* PubSub.publish(chatService, message);
      return message;
    },
  ),
  SubscribeMessages: () =>
    Stream.unwrap(
      Effect.gen(function* () {
        const chatService = yield* ChatPubSub;
        const subscription = yield* PubSub.subscribe(chatService);
        return Stream.fromSubscription(subscription);
      }),
    ),
});

const RootRoute = HttpRouter.add(
  "*",
  "/",
  HttpServerResponse.text("Hello, world!"),
);

const RpcRoute = RpcServer.layerHttp({
  group: MessageRpcs,
  protocol: "websocket",
  path: "/rpc",
}).pipe(
  Layer.provide(MessageHandlers),
  Layer.provide(ChatPubSub.layer),
  Layer.provide(RpcSerialization.layerJson),
  Layer.provide(HttpRouter.cors()),
);

const Routes = Layer.mergeAll(RpcRoute, RootRoute);

const ServerLive = BunHttpServer.layer({ port: 3000 });
HttpRouter.serve(Routes).pipe(
  Layer.provide(ServerLive),
  Layer.launch,
  BunRuntime.runMain,
);
