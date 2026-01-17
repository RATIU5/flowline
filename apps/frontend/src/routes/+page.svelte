<script lang="ts">
import { BrowserSocket } from "@effect/platform-browser";
import { Rpc, RpcClient, RpcGroup, RpcSerialization } from "@effect/rpc";
import { Layer, Effect, Schema, Stream, Chunk } from "effect";
import { MessageRpcs } from "@flowline/rpc";
import { onModify } from "effect/MetricHook";
import { onMount } from "svelte";

let userMessage = $state("");
let sendingMessages = $state<string[]>([]);
let messageHistory = $state<string[]>([]);

const ProtocolLive = RpcClient.layerProtocolSocket({
  retryTransientErrors: true,
}).pipe(
  Layer.provide(BrowserSocket.layerWebSocket("ws://localhost:3000/rpc")),
  Layer.provide(RpcSerialization.layerJson),
);

const messageSubmitProgram = Effect.gen(function* () {
  const client = yield* RpcClient.make(MessageRpcs);
  yield* client.PublishMessage({ message: userMessage });
}).pipe(
  Effect.catchTag("RpcClientError", (error) => {
    return Effect.dieMessage(error.message);
  }),
  Effect.catchAll((error) => {
    console.log(error);
    return Effect.succeed(null);
  }),
  Effect.provide(ProtocolLive),
  Effect.scoped,
);

const subscribeMessagesProgram = Effect.gen(function* () {
  const client = yield* RpcClient.make(MessageRpcs);
  yield* client.SubscribeMessages().pipe(
    Stream.runForEach((m) => {
      messageHistory.push(m.message);
      return Effect.void;
    }),
  );
}).pipe(
  Effect.catchTag("RpcClientError", (error) => {
    return Effect.dieMessage(error.message);
  }),
  Effect.catchAll((error) => {
    console.log(error);
    return Effect.succeed(null);
  }),
  Effect.provide(ProtocolLive),
  Effect.scoped,
);

const handleSubmit = (e: SubmitEvent) => {
  e.preventDefault();
  messageSubmitProgram.pipe(Effect.runPromise);
};

onMount(() => {
  subscribeMessagesProgram.pipe(Effect.runPromise);
});
</script>

<div class="min-h-screen h-full bg-neutral-100 w-full">
  <div class="w-full h-full">
    <div class="prose w-full flex flex-col">
      {#each messageHistory as msg}
        <div class="w-full">
          <p>{msg}</p>
        </div>
      {/each}
    </div>
  </div>
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xl">
    <form
      class="flex flex-row items-center justify-between has-focus-within:border-blue-400 bg-white w-full h-12 border border-solid border-neutral-300 rounded-4xl focus:outline-none focus:border-blue-400 overflow-hidden pr-0.75"
      onsubmit={handleSubmit}
    >
      <input
        bind:value={userMessage}
        type="text"
        id="user-message"
        class="w-full px-4 py-3 focus:outline-none"
        placeholder="Message"
      >
      <button
        type="submit"
        aria-label="Send"
        class="h-full max-h-10 w-full max-w-10 flex items-center justify-center rounded-3xl bg-neutral-100 text-neutral-600 hover:bg-blue-100 hover:text-blue-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 18V6M6 12l6-6l6 6"
          />
        </svg>
      </button>
    </form>
  </div>
</div>
