import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class Message extends Schema.Class<Message>("Message")({
  message: Schema.String,
}) {}

export class MessageRpcs extends RpcGroup.make(
  Rpc.make("PublishMessage", {
    success: Message,
    error: Schema.String,
    payload: Message,
  }),
  Rpc.make("SubscribeMessages", {
    success: Message,
    stream: true,
    error: Schema.String,
  }),
) {}
