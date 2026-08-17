<script lang="ts">
  import type { Message } from "@flowline/rpc/message";

  import Profile from "./profile.svelte";
  import UserDisplay from "./user-display.svelte";

  interface Props {
    messages: Array<typeof Message.Type>;
  }

  const { messages = [] }: Props = $props();
</script>

<main class="flex h-full min-h-full w-full grow flex-col">
  <div class="flex w-full flex-col gap-4">
    {#each messages as msg}
      <div class="flex w-full flex-row items-start gap-3">
        <Profile name={msg.user.displayName} />
        <div class="flex flex-col">
          <UserDisplay name={msg.user.displayName} time={msg.dateCreated} />
          <div>
            <p>{msg.message}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>
</main>
