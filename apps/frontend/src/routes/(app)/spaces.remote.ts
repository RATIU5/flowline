import { ApiClient } from "$lib/client/effects/api-client";
import * as Effect from "effect/Effect";
import { Form } from "svelte-effect-runtime";

import { CreateSpaceInput } from "./spaces.schema";

export const createSpace = Form(CreateSpaceInput, ({ data, invalid }) =>
  Effect.gen(function* () {
    const client = yield* ApiClient;

    return yield* client.space
      .createSpace({ payload: { name: data.name } })
      .pipe(
        Effect.catch((cause) =>
          Effect.logError(cause).pipe(
            Effect.andThen(invalid("Could not create space")),
          ),
        ),
      );
  }),
);
