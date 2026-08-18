import { ApiClient } from "$lib/client/effects/api-client";
import { Effect } from "effect";
import { Query } from "svelte-effect-runtime";

export const createSpace = Query({}, ({ user_id }) =>
  Effect.gen(function* () {
    const client = yield* ApiClient;
    client.space;
  }),
);
