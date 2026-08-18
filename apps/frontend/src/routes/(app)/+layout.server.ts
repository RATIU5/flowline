import type { apiV1 } from "@flowline/api/api";

import { ApiClient } from "$lib/client/effects/api-client";
import * as Effect from "effect/Effect";
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

    const userSpaces = yield* ApiClient.pipe(
      Effect.flatMap((client) =>
        client.space.getSpacesByUser({ params: { userId: user.id } }),
      ),
      Effect.catchTag("NoSpacesForUserError", () =>
        Effect.succeed<apiV1.SpacesSchemaGetResponse>({ spaces: [] }),
      ),
      Effect.catch((cause) =>
        Effect.logError(cause).pipe(
          Effect.andThen(Error("InternalServerError", "Could not load spaces")),
        ),
      ),
    );

    return { user, spaces: userSpaces.spaces };
  }).pipe(Effect.provide(ApiClient.layer)),
);
