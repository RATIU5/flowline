import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { type Message, MessageRpcs } from "@flowline/rpc";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as PubSub from "effect/PubSub";
import * as ServiceMap from "effect/ServiceMap";
import * as Stream from "effect/Stream";
import { HttpServerResponse } from "effect/unstable/http";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

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
  path: "/rpc",
  protocol: "websocket",
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
