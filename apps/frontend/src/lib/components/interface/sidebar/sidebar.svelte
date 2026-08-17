<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import PlusIcon from "remixicon-svelte/icons/add-fill";

  import ThemeSwitcher from "./theme-switcher.svelte";

  let { spaces } = $props();

  const handleAddSpace = () => {};
</script>

<aside class="flex flex-col gap-3 py-3">
  <div class="flex shrink-0 px-3">Test</div>
  <div class="flex min-h-0 flex-1 flex-col gap-2 px-3">
    <Button size="icon-lg" onclick={handleAddSpace}>
      <PlusIcon class="size-6" />
    </Button>
    <div class="h-[1px] w-full bg-border"></div>
    {#each spaces as space}
      <Button size="icon-lg">
        <PlusIcon class="size-6" />
      </Button>
    {/each}
  </div>
  <div class="flex shrink-0 px-3"><ThemeSwitcher /></div>
</aside>
