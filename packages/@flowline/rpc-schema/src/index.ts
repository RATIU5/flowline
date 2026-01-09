import { Rpc, RpcGroup, RpcSchema } from "@effect/rpc";
import { Schema } from "effect";

// Message schema for chat messages
export class ChatMessage extends Schema.Class<ChatMessage>("ChatMessage")({
  id: Schema.String,
  senderId: Schema.String,
  senderName: Schema.String,
  content: Schema.String,
  timestamp: Schema.DateTimeUtc,
}) {}

// RPC group defining available remote procedures
// - SendMessage: Send a message, returns the created ChatMessage
// - Messages: Subscribe to a stream of incoming messages
export class MessageRpcs extends RpcGroup.make(
  Rpc.make("SendMessage", {
    payload: {
      content: Schema.String,
      senderName: Schema.String,
    },
    success: ChatMessage,
  }),
  Rpc.make("Messages", {
    success: RpcSchema.Stream({
      success: ChatMessage,
      failure: Schema.Never,
    }),
  }),
) {}
