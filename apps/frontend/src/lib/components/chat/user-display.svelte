<script lang="ts">
import type { Utc } from "effect/DateTime";

interface Props {
  name: string;
  time?: Utc;
  class?: string;
}

let { name, time, class: className = "" }: Props = $props();

const calcDateSent = (utcTime: Utc | undefined) => {
  const now = Date.now();
  const diff = now - (utcTime?.epochMilliseconds ?? 0);

  if (diff < 60_000) {
    return "Just now";
  } else if (diff < 3_600_000) {
    const minutes = Math.floor(diff / 60_000);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diff < 86_400_000) {
    const hours = Math.floor(diff / 3_600_000);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diff / 86_400_000);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
};
</script>

<div
  class={[
		"inline-flex min-w-0 items-center gap-3 rounded-md",
		className,
	].join(" ")}
>
  <div class="min-w-0 flex-1 truncate">
    <span class="font-extrabold tracking-[-0.02em] text-neutral-700">
      {name}
    </span>
  </div>

  <time class="shrink-0 text-xs font-semibold tabular-nums text-neutral-400">
    {calcDateSent(time)}
  </time>
</div>
