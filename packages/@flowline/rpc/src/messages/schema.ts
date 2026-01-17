import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export class Message extends Schema.Class<Message>("Message")({
  message: Schema.String,
}) {}

export class MessageRpcs extends RpcGroup.make(
  Rpc.make("PublishMessage", {
    success: Message,
    error: Schema.String,
    payload: {
      message: Schema.String,
    },
  }),
  Rpc.make("SubscribeMessages", {
    success: Message,
    stream: true,
    error: Schema.String,
  }),
) {}
