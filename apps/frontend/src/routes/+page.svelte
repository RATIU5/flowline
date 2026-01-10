<script lang="ts">
import { onMount, onDestroy } from "svelte";
import { type ChatMessage, MessageRpcs } from "@flowline/rpc";
import { Effect, Exit, Scope, Stream, Layer } from "effect";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import type { RpcClientError } from "@effect/rpc/RpcClientError";
import { BrowserSocket } from "@effect/platform-browser";

type DisplayMessage = {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
};

let messages = $state<DisplayMessage[]>([]);
let messageInput = $state("");
let userName = $state("Anonymous");
let connected = $state(false);
let client: RpcClient.FromGroup<typeof MessageRpcs, RpcClientError> | null =
  null;

const avatarColors = [
  "bg-indigo-500",
  "bg-green-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
];

const getAvatarColor = (name: string) => {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return isToday ? `Today at ${time}` : `${date.toLocaleDateString()} ${time}`;
};

const chatMessageToDisplay = (msg: ChatMessage): DisplayMessage => ({
  id: msg.id,
  author: msg.senderName,
  avatar: getAvatarColor(msg.senderName),
  timestamp: formatTimestamp(new Date(Number(msg.timestamp.epochMillis))),
  content: msg.content,
});

// --- Effect RPC Client Setup ---

// Layer providing the WebSocket connection to the backend
const SocketLive = BrowserSocket.layerWebSocket("ws://localhost:3001/rpc");

// Layer providing the RPC protocol over the socket with NDJSON serialization
const ProtocolLive = RpcClient.layerProtocolSocket().pipe(
  Layer.provide(RpcSerialization.layerNdjson),
  Layer.provide(SocketLive),
);

// Scope that lives for the component lifetime - keeps the WebSocket open
let rpcScope: Scope.CloseableScope | null = null;

onMount(async () => {
  try {
    // Create a scope that persists until component unmounts
    // This is crucial: without it, the WebSocket closes immediately
    rpcScope = Effect.runSync(Scope.make());

    // Build a runtime from the protocol layer
    // The runtime contains the context (socket, serialization) needed by RPC calls
    const runtime = await Effect.runPromise(
      Layer.toRuntime(ProtocolLive).pipe(Scope.extend(rpcScope)),
    );

    // Create the RPC client - this gives us typed methods for each RPC
    const c = await Effect.runPromise(
      RpcClient.make(MessageRpcs).pipe(
        Effect.provide(runtime),
        Scope.extend(rpcScope),
      ),
    );

    client = c;
    connected = true;

    // Subscribe to the message stream
    // This calls the Messages RPC which returns a Stream of ChatMessages
    Effect.runFork(
      c.Messages(undefined as void).pipe(
        Stream.runForEach((msg: ChatMessage) =>
          Effect.sync(() => {
            messages = [...messages, chatMessageToDisplay(msg)];
          }),
        ),
        Effect.provide(runtime),
      ),
    );
  } catch (e) {
    console.error("Failed to connect:", e);
    connected = false;
  }
});

onDestroy(() => {
  // Close the scope to clean up the WebSocket connection
  if (rpcScope) {
    Effect.runFork(Scope.close(rpcScope, Exit.void));
  }
});

const sendMessage = async (e: Event) => {
  e.preventDefault();
  if (!client || !messageInput.trim()) return;

  try {
    await Effect.runPromise(
      client.SendMessage({ content: messageInput, senderName: userName }),
    );
    messageInput = "";
  } catch (e) {
    console.error("Failed to send:", e);
  }
};
</script>

<div class="flex flex-col h-screen bg-gray-700">
  <div class="px-4 py-2 bg-gray-800 flex items-center gap-4">
    <input
      type="text"
      bind:value={userName}
      placeholder="Your name"
      class="bg-gray-600 px-3 py-1 rounded text-gray-100 placeholder-gray-400 focus:outline-none w-40"
    >
    <span class="text-gray-400 text-sm">
      {connected ? "🟢 Connected" : "🔴 Disconnected"}
    </span>
  </div>

  <div class="flex-1 overflow-y-auto px-4 py-2">
    {#each messages as msg (msg.id)}
      <div
        class="flex items-start gap-3 py-2 hover:bg-gray-750 rounded px-2 group"
      >
        <div
          class="w-10 h-10 rounded-full {msg.avatar} shrink-0 flex items-center justify-center text-white font-semibold"
        >
          {msg.author[0]}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="font-medium text-white">{msg.author}</span>
            <span class="text-xs text-gray-400">{msg.timestamp}</span>
          </div>
          <p class="text-gray-100">{msg.content}</p>
        </div>
      </div>
    {/each}
    {#if messages.length === 0}
      <div class="text-gray-400 text-center py-8">
        No messages yet. Start the conversation!
      </div>
    {/if}
  </div>

  <div class="px-4 pb-6 pt-2">
    <form
      onsubmit={sendMessage}
      class="flex items-center bg-gray-600 rounded-lg"
    >
      <button
        type="button"
        class="p-3 text-gray-400 hover:text-gray-200"
        aria-label="Add attachment"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
      <input
        type="text"
        bind:value={messageInput}
        placeholder="Message #general"
        class="flex-1 bg-transparent px-2 py-3 text-gray-100 placeholder-gray-400 focus:outline-none"
      >
      <button
        type="submit"
        disabled={!connected || !messageInput.trim()}
        class="p-3 text-gray-400 hover:text-gray-200 disabled:opacity-50"
        aria-label="Send message"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </form>
  </div>
</div>
