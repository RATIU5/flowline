import { PUBLIC_BASE_URL } from "$env/static/public";
import { AuthClient } from "$lib/client/effects/auth";
import { redirect } from "@sveltejs/kit";
import * as Effect from "effect/Effect";
import { wrapServerLoad } from "sveltekit-effect-runtime";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = wrapServerLoad(
  Effect.gen(function* () {
    const auth = yield* AuthClient(new URL(PUBLIC_BASE_URL));

    yield* Effect.promise(() =>
      auth.signOut({
        fetchOptions: {
          onSuccess: () => redirect(302, "/login"),
          onError: () => redirect(302, "/login"),
        },
      }),
    );
  }),
);
