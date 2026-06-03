import type { Handle } from "@sveltejs/kit";

import { PUBLIC_BASE_URL } from "$env/static/public";
import { AuthClient } from "$lib/client/effects/auth";
import { runtime } from "$lib/shared/effects/runtime";
import * as Effect from "effect/Effect";

export const handle: Handle = runtime.handle(({ event, resolve }) =>
  Effect.gen(function* () {
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

    return yield* Effect.promise(() => Promise.resolve(resolve(event)));
  }),
);
