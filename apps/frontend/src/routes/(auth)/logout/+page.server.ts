import { PUBLIC_BASE_URL } from "$env/static/public";
import { AuthClient } from "$lib/client/effects/auth";
import * as Effect from "effect/Effect";
import { Handler, Redirect } from "svelte-effect-runtime/server";

import type { PageServerLoad } from "./$types";

export const load = Handler<PageServerLoad>(function* () {
  const auth = yield* AuthClient(new URL(PUBLIC_BASE_URL));

  yield* Effect.tryPromise(() => auth.signOut()).pipe(
    Effect.catch((cause) => Effect.logError(cause)),
  );

  return yield* Redirect("Found", "/login");
});
