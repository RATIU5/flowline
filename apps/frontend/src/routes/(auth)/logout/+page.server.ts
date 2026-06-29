import { PUBLIC_BASE_URL } from "$env/static/public";
import { AuthClient } from "$lib/client/effects/auth";
import { runtime } from "$lib/shared/effects/runtime";
import { redirect } from "@sveltejs/kit";
import * as Effect from "effect/Effect";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = runtime.load(
  Effect.gen(function* () {
    const auth = yield* AuthClient(new URL(PUBLIC_BASE_URL));

    return yield* Effect.promise(() =>
      auth.signOut({
        fetchOptions: {
          onSuccess: () => redirect(302, "/login"),
          onError: () => redirect(302, "/login"),
        },
      }),
    );
  }),
);
