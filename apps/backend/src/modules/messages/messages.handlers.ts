import { MessageRpcs } from "@flowline/rpc";
import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";
import * as Stream from "effect/Stream";

import { ChatPubSub } from "./messages.service";

export const MessageHandlers = MessageRpcs.toLayer({
  PublishMessage: Effect.fn(
    "backend/modules/messages/messages.handlers/PublishMessage",
  )(function* (message) {
    const chatService = yield* ChatPubSub;
    yield* PubSub.publish(chatService, message);
    return message;
  }),
  SubscribeMessages: () =>
    Stream.unwrap(
      Effect.gen(function* () {
        const chatService = yield* ChatPubSub;
        const subscription = yield* PubSub.subscribe(chatService);
        return Stream.fromSubscription(subscription);
      }),
    ),
});
