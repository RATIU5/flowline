import type { Message } from "@flowline/rpc/message";

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as PubSub from "effect/PubSub";
import * as ServiceMap from "effect/ServiceMap";

export class ChatPubSub extends ServiceMap.Service<ChatPubSub>()(
  "@flowline/backend/modules/messages/messages.service/ChatPubSub",
  {
    make: Effect.gen(function* () {
      const pubSub = yield* PubSub.bounded<Message>(2);
      return pubSub;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
