<script lang="ts">
import { BrowserSocket } from "@effect/platform-browser";
import { AuthClient } from "@flowline/auth/client";
import { type Message, MessageRpcs } from "@flowline/rpc/message";
import * as Console from "effect/Console";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as ServiceMap from "effect/ServiceMap";
import * as Stream from "effect/Stream";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { onMount } from "svelte";
import { PUBLIC_BASE_URL } from "$env/static/public";
import MessagesDisplay from "$lib/components/chat/messages-display.svelte";

let userMessage = $state("");
let sendingMessages = $state<Array<string>>([]);
let messageHistory = $state<Array<typeof Message.Type>>([]);

const ProtocolLive = RpcClient.layerProtocolSocket({
  retryTransientErrors: true,
}).pipe(
  Layer.provide(BrowserSocket.layerWebSocket("ws://localhost:3000/rpc")),
  Layer.provide(RpcSerialization.layerJson),
);

class RpcMessageClient extends ServiceMap.Service<RpcMessageClient>()(
  "@flowline/frontend/RpcMessageClient",
  {
    make: Effect.gen(function* () {
      return yield* RpcClient.make(MessageRpcs);
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ProtocolLive),
  );
}

const messageSubmitProgram = Effect.gen(function* () {
  if (userMessage.trim() === "") {
    return yield* Effect.void;
  }
  const client = yield* RpcMessageClient;
  const auth = yield* AuthClient(new URL(PUBLIC_BASE_URL));

  const session = yield* Effect.promise(() => auth.getSession());

  yield* client.PublishMessage({
    message: userMessage,
    user: {
      displayName: session.data?.user.name ?? "Unknown User",
    },
    dateCreated: DateTime.makeUnsafe(new Date(Date.now())),
  });

  yield* Effect.sync(() => {
    sendingMessages.push(userMessage);
    userMessage = "";
  });
}).pipe(
  Effect.catchTag("RpcClientError", (error) => Effect.die(error.message)),
  Effect.catch((error) =>
    Console.error(error).pipe(Effect.andThen(Effect.void)),
  ),
);

const subscribeMessagesProgram = Effect.gen(function* () {
  const client = yield* RpcMessageClient;
  yield* client.SubscribeMessages().pipe(
    Stream.runForEach((m) => {
      messageHistory.push(m);
      return Effect.void;
    }),
  );
}).pipe(
  Effect.catchTag("RpcClientError", (error) => Effect.die(error.message)),
  Effect.catch((error) =>
    Console.error(error).pipe(Effect.andThen(Effect.void)),
  ),
);

const runtime = ManagedRuntime.make(RpcMessageClient.layer);

const handleSubmit = (e: SubmitEvent) => {
  e.preventDefault();
  messageSubmitProgram.pipe(runtime.runPromise);
};

onMount(() => {
  subscribeMessagesProgram.pipe(runtime.runPromise);
});
</script>

<div class="min-h-screen h-full bg-neutral-100 w-full">
  <div class="p-4"><MessagesDisplay messages={messageHistory} /></div>
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xl">
    <form
      class="flex flex-row items-center justify-between has-focus-within:border-blue-400 bg-white w-full h-12 border border-solid border-neutral-300 focus:outline-none focus:border-blue-400 overflow-hidden pr-0.75"
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
        class="h-full max-h-10 w-full max-w-10 flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-blue-100 hover:text-blue-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <title>Send message arrow</title>
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
