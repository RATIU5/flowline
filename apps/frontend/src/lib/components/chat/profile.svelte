<script lang="ts">
interface Props {
  name: string;
  src?: string | null;
  size?: number;
  alt?: string;
  class?: string;
}

let {
  name,
  src = undefined,
  size = 40,
  alt,
  class: className = "",
}: Props = $props();

let imageFailed = $state(false);

const initials = $derived.by(() => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? "U"}${parts[1]?.[0] ?? "n"}`.toUpperCase();
});

const hue = $derived.by(() => {
  let hash = 0;

  for (const char of initials) {
    hash = (char.codePointAt(0) ?? -1) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
});

const showImage = $derived(Boolean(src) && !imageFailed);

const styleVars = $derived(
  [
    `--avatar-size:${size}px`,
    `--avatar-font-size:${Math.max(12, Math.round(size * 0.36))}px`,
    `--avatar-bg:hsl(${hue} 60% 50%)`,
    `--avatar-fg:white`,
  ].join(";"),
);
</script>

<div
  class={[
		"inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full mt-1",
		"size-[var(--avatar-size)]",
		className,
	].join(" ")}
  style={styleVars}
  aria-label={alt ?? name}
  title={name}
>
  {#if showImage}
    <img
      src={src!}
      alt={alt ?? name}
      class="h-full w-full object-cover"
      onerror={() => {
				imageFailed = true;
			}}
    >
  {:else}
    <div
      aria-hidden="true"
      class="flex h-full w-full items-center justify-center bg-[var(--avatar-bg)] text-[length:var(--avatar-font-size)] font-semibold uppercase leading-none text-[var(--avatar-fg)]"
    >
      {initials}
    </div>
  {/if}
</div>
