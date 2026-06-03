import { runtime } from "$lib/shared/effects/runtime";
import { redirect } from "@sveltejs/kit";
import * as Effect from "effect/Effect";

export const load = runtime.load(
  Effect.gen(function* () {
    const { url, locals } = yield* runtime.CurrentServerLoadEvent;
    if (!locals.user) {
      return redirect(302, `/login?next=${encodeURIComponent(url.pathname)}`);
    }

    return {
      user: locals.user,
    };
  }),
);
