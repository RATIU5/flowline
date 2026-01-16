<script lang="ts">
import { FetchHttpClient } from "@effect/platform";
import { BrowserSocket } from "@effect/platform-browser";
import { Rpc, RpcClient, RpcGroup, RpcSerialization } from "@effect/rpc";
import { Layer, Effect, Schema, Stream, Chunk, Option } from "effect";

export class Message extends Schema.Class<Message>("Message")({
  message: Schema.String,
}) {}

class MessageRpcs extends RpcGroup.make(
  Rpc.make("HelloRpc", {
    success: Message,
    error: Schema.String,
    payload: {
      foo: Schema.String,
    },
  }),
) {}

let message = $state("");

const ProtocolLive = RpcClient.layerProtocolSocket({
  retryTransientErrors: true,
}).pipe(
  Layer.provide(BrowserSocket.layerWebSocket("ws://localhost:3000/rpc")),
  Layer.provide(RpcSerialization.layerJson),
);

const program = Effect.gen(function* () {
  const client = yield* RpcClient.make(MessageRpcs);
  const response = yield* client.HelloRpc({ foo: "bar" });
  message = response.message;
}).pipe(Effect.scoped);

program.pipe(Effect.provide(ProtocolLive), Effect.runPromise);
</script>

<div class="flex flex-col h-screen">{message ?? "Connecting..."}</div>
