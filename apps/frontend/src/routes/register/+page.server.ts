import { Data, Effect, Schema } from "effect";
import { fail } from "@sveltejs/kit";
import { RegisterSchema } from "./register-schema";
import type { Actions } from "./$types";

class InvalidFormData extends Data.TaggedError("InvalidFormData")<{
  message: string;
}> {}

export const load = async ({ locals }) => {
  return {
    user: locals.user || null,
    session: locals.session || null,
  };
};

export const actions = {
  default: async ({ request }) => {
    return await Effect.gen(function* () {
      const formData = yield* Effect.tryPromise(() => request.formData()).pipe(
        Effect.catchTag("UnknownException", () =>
          Effect.fail(new InvalidFormData({ message: "Invalid form data" })),
        ),
      );

      const accountData = yield* Schema.decode(RegisterSchema, {
        errors: "all",
      })(formData);

      yield* Effect.logInfo(accountData);

      return { success: true, data: accountData };
    }).pipe(
      Effect.catchAll((error) => {
        let errorMessage = "Validation failed";

        if (typeof error === "string") {
          errorMessage = error;
        } else if (error && typeof error === "object") {
          errorMessage =
            error.message || error.toString() || "Validation failed";
        }

        console.log(error);

        return Effect.succeed(
          fail(422, {
            success: false,
            data: errorMessage,
          }),
        );
      }),
      Effect.runPromise,
    );
  },
} satisfies Actions;
