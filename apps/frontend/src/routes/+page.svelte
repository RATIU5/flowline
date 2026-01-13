<script lang="ts">
let messages = $state([]);
</script>

<div class="flex flex-col h-screen bg-gray-700">
  <div class="px-4 py-2 bg-gray-800 flex items-center gap-4">
    <input
      type="text"
      placeholder="Your name"
      class="bg-gray-600 px-3 py-1 rounded text-gray-100 placeholder-gray-400 focus:outline-none w-40"
    >
    <span class="text-gray-400 text-sm"> {"🔴 Disconnected"} </span>
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
    <form class="flex items-center bg-gray-600 rounded-lg">
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
        placeholder="Message #general"
        class="flex-1 bg-transparent px-2 py-3 text-gray-100 placeholder-gray-400 focus:outline-none"
      >
      <button
        type="submit"
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
