import type { Handle } from "@sveltejs/kit";

import { PUBLIC_BASE_URL } from "$env/static/public";
import { AuthClient } from "$lib/client/effects/auth";
import * as Effect from "effect/Effect";
import { Handler } from "svelte-effect-runtime/server";

export const handle = Handler<Handle>(function* ({ event, resolve }) {
  const auth = yield* AuthClient(new URL(PUBLIC_BASE_URL));

  const { data, error } = yield* Effect.promise(() =>
    auth.getSession({ fetchOptions: { headers: event.request.headers } }),
  );

  if (error) {
    yield* Effect.logDebug(error.message);
  } else {
    event.locals.user = data?.user;
  }

  return yield* Effect.promise(() => Promise.resolve(resolve(event)));
});
