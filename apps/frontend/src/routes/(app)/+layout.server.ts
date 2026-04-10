import { redirect } from "@sveltejs/kit";
import * as Effect from "effect/Effect";
import {
  SvelteKitRequestEvent,
  wrapServerLoad,
} from "sveltekit-effect-runtime";

export const load = wrapServerLoad(
  Effect.gen(function* () {
    const { url, locals } = yield* SvelteKitRequestEvent;
    if (!locals.user) {
      return redirect(302, `/login?next=${encodeURIComponent(url.pathname)}`);
    }

    return {
      user: locals.user,
    };
  }),
);
