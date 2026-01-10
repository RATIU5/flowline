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

// Error schema for database/server errors
export class MessageError extends Schema.TaggedError<MessageError>()(
  "MessageError",
  { message: Schema.String },
) {}

// RPC group defining available remote procedures
export class MessageRpcs extends RpcGroup.make(
  Rpc.make("SendMessage", {
    payload: {
      content: Schema.String,
      senderName: Schema.String,
    },
    success: ChatMessage,
    error: MessageError,
  }),
  Rpc.make("Messages", {
    success: RpcSchema.Stream({
      success: ChatMessage,
      failure: MessageError,
    }),
  }),
) {}
