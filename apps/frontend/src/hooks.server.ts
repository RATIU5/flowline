import type { Handle } from "@sveltejs/kit";

import { PUBLIC_BASE_URL } from "$env/static/public";
import { AuthClient } from "$lib/client/effects/auth";
import * as Effect from "effect/Effect";
import { SvelteHandleParams, wrapHandle } from "sveltekit-effect-runtime";

export const handle: Handle = wrapHandle(
  Effect.gen(function* () {
    const { event, resolve } = yield* SvelteHandleParams.SvelteHandleParams;

    const auth = yield* AuthClient(new URL(PUBLIC_BASE_URL));
    const { data, error } = yield* Effect.promise(() =>
      auth.getSession({
        fetchOptions: {
          headers: event.request.headers,
        },
      }),
    );

    if (!error) {
      event.locals.user = data ? data.user : undefined;
    } else {
      yield* Effect.logDebug(error.message);
    }

    return yield* resolve(event);
  }),
);
