<script lang="ts">
import "../layout.css";
import type { LayoutProps } from "./$types";

const { data, children }: LayoutProps = $props();
</script>

{#if data.spaces.length === 0}
  <p>No spaces found</p>
{:else}
  {@render children()}
{/if}
