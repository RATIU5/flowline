import { HttpLayerRouter, HttpServer } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { ChatMessage, MessageRpcs } from "@flowline/rpc-schema";
import { DateTime, Effect, Layer, Mailbox, PubSub, Stream } from "effect";

// RPC handler implementations
// Uses PubSub for broadcasting messages to all connected clients
const MessageRpcsLive = MessageRpcs.toLayer(
  Effect.gen(function* () {
    // Shared PubSub - all subscribers receive all published messages
    const pubsub = yield* PubSub.unbounded<ChatMessage>();
    let messageId = 0;

    return {
      // Handle incoming message: create ChatMessage, publish to all subscribers
      SendMessage: (payload) =>
        Effect.gen(function* () {
          const msg = new ChatMessage({
            id: String(++messageId),
            senderId: `user-${Math.random().toString(36).slice(2, 8)}`,
            senderName: payload.senderName,
            content: payload.content,
            timestamp: yield* DateTime.now,
          });
          yield* PubSub.publish(pubsub, msg);
          return msg;
        }),

      // Stream handler: subscribe to PubSub and forward messages via Mailbox
      // Each client gets their own subscription, receiving all future messages
      Messages: () =>
        Effect.gen(function* () {
          const mailbox = yield* Mailbox.make<ChatMessage>();
          const subscription = yield* PubSub.subscribe(pubsub);

          // Forward PubSub messages to the mailbox in a background fiber
          yield* Stream.fromQueue(subscription).pipe(
            Stream.runForEach((msg) => mailbox.offer(msg)),
            Effect.forkScoped,
          );

          return mailbox;
        }),
    };
  }),
);

// WebSocket RPC server at /rpc using NDJSON serialization
const RpcRoute = RpcServer.layerHttpRouter({
  group: MessageRpcs,
  path: "/rpc",
  protocol: "websocket",
}).pipe(
  Layer.provide(RpcSerialization.layerNdjson),
  Layer.provide(MessageRpcsLive),
);

// CORS configuration for frontend access
const AllRoutes = Layer.mergeAll(RpcRoute).pipe(
  Layer.provide(
    HttpLayerRouter.cors({
      allowedOrigins: ["http://localhost:5173"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  ),
);

// Start server
const router = HttpLayerRouter.serve(AllRoutes);
const app = router.pipe(HttpServer.withLogAddress);
const ServerLive = BunHttpServer.layer({ port: 3001 });

Layer.provide(app, ServerLive).pipe(Layer.launch, BunRuntime.runMain);
