import { svelteKitHandler } from "better-auth/svelte-kit";
import * as Effect from "effect/Effect";
import { SvelteHandleParams } from "sveltekit-effect-runtime";

import { AuthEffect } from "../../../lib/auth";

const SvelteKitBetterAuthEffectHandler = Effect.fn(
  "@flowline/auth/modules/sveltekit/sveltekit.handler",
)(function* (building: boolean) {
  const auth = yield* AuthEffect;
  const { resolve, event } = yield* SvelteHandleParams.SvelteHandleParams;
  return yield* Effect.promise(() =>
    // This should never fail
    svelteKitHandler({
      event,
      resolve,
      auth,
      building,
    }),
  );
});

export default SvelteKitBetterAuthEffectHandler;
