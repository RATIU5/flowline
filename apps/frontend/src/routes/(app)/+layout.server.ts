import { ApiClient } from "$lib/client/effects/api-client";
import { Space } from "@flowline/api/space";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import {
  Error,
  Handler,
  Redirect,
  RequestEvent,
} from "svelte-effect-runtime/server";

import type { LayoutServerLoad } from "./$types";

export const load = Handler<LayoutServerLoad>(() =>
  Effect.gen(function* () {
    const { url, locals } = yield* RequestEvent;
    const user = locals.user;

    if (!user) {
      return yield* Redirect(
        "Found",
        `/login?next=${encodeURIComponent(url.pathname)}`,
      );
    }

    const spaces = yield* Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* client.space.listSpaces();
    }).pipe(
      // Transport, decode and 401 failures all mean the same thing here.
      Effect.catch((cause) =>
        Effect.logError(cause).pipe(
          Effect.andThen(Error("InternalServerError", "Could not load spaces")),
        ),
      ),
    );

    // `Space` is a Schema.Class (and `createdAt` a DateTime) — neither survives
    // SvelteKit's POJO-only load serialization, so hand the client the encoded form.
    return {
      user,
      spaces: yield* Schema.encodeUnknownEffect(Schema.Array(Space))(spaces).pipe(
        Effect.orDie,
      ),
    };
  }),
);
