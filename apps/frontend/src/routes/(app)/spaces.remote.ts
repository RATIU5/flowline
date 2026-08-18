import { ApiClient } from "$lib/client/effects/api-client";
import { Effect, Schema } from "effect";
import { Form } from "svelte-effect-runtime";

export const createSpace = Form(
  Schema.Struct({
    ownerId: Schema.String,
    name: Schema.String,
  }),
  ({ data, invalid }) =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const res = yield* client.space
        .createSpace({
          payload: { ownerId: data.ownerId, name: data.name },
        })
        .pipe(
          Effect.catchTags({
            MissingPayload: (e) =>
              Effect.gen(function* () {
                yield* invalid("Missing ");
              }),
          }),
        );
    }),
);
