import type { Message } from "@flowline/rpc/message";

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as PubSub from "effect/PubSub";

export class ChatPubSub extends Context.Service<ChatPubSub>()(
  "@flowline/backend/modules/messages/messages.service/ChatPubSub",
  {
    make: Effect.gen(function* () {
      const pubSub = yield* PubSub.unbounded<Message>();
      return pubSub;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
