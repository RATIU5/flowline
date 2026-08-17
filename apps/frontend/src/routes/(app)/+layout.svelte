<script lang="ts">
  import Sidebar from "$lib/components/interface/sidebar/sidebar.svelte";
  import { ModeWatcher } from "mode-watcher";

  import "../layout.css";

  import type { LayoutProps } from "./$types";

  const { data, children }: LayoutProps = $props();
</script>

<ModeWatcher />
<main class="flex h-screen">
  <Sidebar spaces={data.spaces} />
</main>
