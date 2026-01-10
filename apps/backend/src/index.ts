import { HttpLayerRouter, HttpServer } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { KyselyDB, PgLive } from "@flowline/database";
import { ChatMessage, MessageError, MessageRpcs } from "@flowline/rpc";
import { DateTime, Effect, Layer, Mailbox, PubSub, Stream } from "effect";

// Map SqlError to MessageError for RPC
const mapDbError = Effect.mapError((e: unknown) =>
  new MessageError({ message: String(e) }),
);

const MessageRpcsLive = MessageRpcs.toLayer(
  Effect.gen(function* () {
    const db = yield* KyselyDB;
    const pubsub = yield* PubSub.unbounded<ChatMessage>();

    return {
      // Persist message, then broadcast to subscribers
      SendMessage: (payload) =>
        Effect.gen(function* () {
          const senderId = `user-${crypto.randomUUID().slice(0, 8)}`;

          // Insert returns generated fields
          const [row] = yield* db
            .insertInto("messages")
            .values({
              sender_id: senderId,
              sender_name: payload.senderName,
              content: payload.content,
            })
            .returning(["id", "created_at"]);

          const msg = new ChatMessage({
            id: row.id,
            senderId,
            senderName: payload.senderName,
            content: payload.content,
            timestamp: DateTime.unsafeFromDate(row.created_at),
          });

          yield* PubSub.publish(pubsub, msg);
          return msg;
        }).pipe(mapDbError),

      // Load recent messages, then stream new ones
      Messages: () =>
        Effect.gen(function* () {
          const mailbox = yield* Mailbox.make<ChatMessage, MessageError>();

          // Load last 50 messages from DB
          const recent = yield* db
            .selectFrom("messages")
            .selectAll()
            .orderBy("created_at", "desc")
            .limit(50);

          // Send history (oldest first)
          for (const row of recent.reverse()) {
            yield* mailbox.offer(
              new ChatMessage({
                id: row.id,
                senderId: row.sender_id,
                senderName: row.sender_name,
                content: row.content,
                timestamp: DateTime.unsafeFromDate(row.created_at),
              }),
            );
          }

          // Subscribe to new messages
          const subscription = yield* PubSub.subscribe(pubsub);
          yield* Stream.fromQueue(subscription).pipe(
            Stream.runForEach((msg) => mailbox.offer(msg)),
            Effect.forkScoped,
          );

          return mailbox;
        }).pipe(mapDbError),
    };
  }),
).pipe(Layer.provide(KyselyDB.Default));

// Routes
const RpcRoute = RpcServer.layerHttpRouter({
  group: MessageRpcs,
  path: "/rpc",
  protocol: "websocket",
}).pipe(
  Layer.provide(RpcSerialization.layerNdjson),
  Layer.provide(MessageRpcsLive),
);

const AllRoutes = Layer.mergeAll(RpcRoute).pipe(
  Layer.provide(
    HttpLayerRouter.cors({
      allowedOrigins: ["http://localhost:5173"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  ),
);

// Compose layers: KyselyDB.Default needs SqlClient from PgLive
const DbLive = KyselyDB.Default.pipe(Layer.provide(PgLive));

const router = HttpLayerRouter.serve(AllRoutes);
const app = router.pipe(HttpServer.withLogAddress);
const ServerLive = BunHttpServer.layer({ port: 3001 });

// Provide DbLive to AllRoutes (for MessageRpcsLive), then compose with server
const AppLive = Layer.provide(app, ServerLive).pipe(
  Layer.provide(DbLive),
  Layer.provide(PgLive),
);
Layer.launch(AppLive).pipe(BunRuntime.runMain);
