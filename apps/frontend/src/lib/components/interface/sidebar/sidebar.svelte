<script lang="ts">
  import type { LayoutServerData } from "../../../../routes/(app)/$types";

  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Effect from "effect/Effect";
  import PlusIcon from "remixicon-svelte/icons/add-fill";

  import { createSpace } from "../../../../routes/(app)/spaces.remote";
  import { CreateSpaceInput } from "../../../../routes/(app)/spaces.schema";
  import ThemeSwitcher from "./theme-switcher.svelte";

  let { spaces }: { spaces: LayoutServerData["spaces"] } = $props();

  let open = $state(false);

  // Same schema client-side (instant issues, no round trip) and server-side.
  const form = createSpace.preflight(CreateSpaceInput);

  // Close only on success; invalid submissions leave the dialog up with issues.
  const formProps = form.enhance(({ submit }) =>
    Effect.gen(function* () {
      yield* submit();
      yield* Effect.sync(() => {
        open = false;
      });
    }).pipe(Effect.catch(() => Effect.void)),
  );
</script>

<aside class="flex flex-col gap-3 py-3">
  <div class="flex shrink-0 px-3">
    <!-- HEADER -->
  </div>
  <div class="flex min-h-0 flex-1 flex-col gap-2 px-3">
    <!-- SPACES -->
    <Dialog.Root bind:open>
      <Dialog.Trigger type="button" class={buttonVariants({ size: "icon-lg" })}>
        <PlusIcon class="size-6" />
        <span class="sr-only">New space</span>
      </Dialog.Trigger>
      <Dialog.Content>
        <!-- The form lives inside the portalled content so its inputs are
             actually inside the <form> element. -->
        <form {...formProps} class="grid gap-4">
          <Dialog.Header>
            <Dialog.Title>New Space</Dialog.Title>
            <Dialog.Description>
              Create a new space for a group of people.
            </Dialog.Description>
          </Dialog.Header>

          <div class="grid gap-3">
            <Label for="space-name">Space Name</Label>
            <!-- ponytail: plain name= rather than fields.name.as("text") — the
                 shadcn Input takes `value` as its own $bindable, so the
                 accessor's setter never round-trips. DOM is the source of truth. -->
            <Input
              id="space-name"
              name="name"
              placeholder="SuperSpace"
              aria-invalid={form.fields.name.issues() !== undefined}
            />
            {#each form.fields.name.issues() ?? [] as issue}
              <p class="text-sm text-destructive">{issue.message}</p>
            {/each}
          </div>

          {#each form.fields.allIssues() ?? [] as issue}
            <p class="text-sm text-destructive">{issue.message}</p>
          {/each}

          <Dialog.Footer>
            <Dialog.Close
              type="button"
              class={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </Dialog.Close>
            <Button type="submit" disabled={form.pending > 0}>Create</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
    <div class="h-[1px] w-full bg-border"></div>
    {#each spaces as space (space.id)}
      <Button size="icon-lg" title={space.name}>
        {space.name.slice(0, 1).toUpperCase()}
      </Button>
    {/each}
  </div>
  <div class="flex shrink-0 px-3">
    <!-- FOOTER -->
    <ThemeSwitcher />
  </div>
</aside>
