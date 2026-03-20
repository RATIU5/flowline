import * as Schema from "effect/Schema";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class Message extends Schema.Class<Message>("Message")({
  message: Schema.String,
}) {}

export class MessageRpcs extends RpcGroup.make(
  Rpc.make("PublishMessage", {
    error: Schema.String,
    payload: Message,
    success: Message,
  }),
  Rpc.make("SubscribeMessages", {
    error: Schema.String,
    stream: true,
    success: Message,
  }),
) {}
