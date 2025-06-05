import { Data, Effect, Schema } from "effect";
import { fail, json } from "@sveltejs/kit";

class InvalidFormData extends Data.TaggedError("InvalidFormData")<{
  message: string;
}> {}

const isEmail = (s: string) => /^[^@]+@[^@]+\.[^@]+$/.test(s);
const hasLowercase = (s: string): boolean => /[a-z]/.test(s);
const hasUppercase = (s: string): boolean => /[A-Z]/.test(s);
const hasNumber = (s: string): boolean => /\d/.test(s);
const hasSymbol = (s: string): boolean =>
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s);

const PasswordSchema = Schema.String.pipe(
  Schema.minLength(8, { message: () => "Must be at least 8 characters long" }),
  Schema.maxLength(28, { message: () => "Must be at most 28 characters long" }),
  Schema.filter((p) => hasLowercase(p), {
    message: () => "Must have at least one lowercase letter",
  }),
  Schema.filter((p) => hasUppercase(p), {
    message: () => "Must have at least one uppercase letter",
  }),
  Schema.filter((p) => hasNumber(p), {
    message: () => "Must have at least one number",
  }),
  Schema.filter((p) => hasSymbol(p), {
    message: () => "Must have at least one symbol",
  }),
);

const FormDataSchema = Schema.Struct({
  displayName: Schema.String.annotations({ default: "" }),
  email: Schema.String.pipe(
    Schema.filter((s) => isEmail(s) || "Must be a valid email", {
      jsonSchema: { format: "email" },
    }),
  ),
  password: PasswordSchema,
  confirmPassword: Schema.NonEmptyString,
}).pipe(
  Schema.filter((data) => data.password === data.confirmPassword, {
    message: () => "Passwords must match",
  }),
);

const AccountDataSchema = Schema.Struct({
  displayName: Schema.String,
  email: Schema.String,
  password: Schema.String,
});

const registerSchema = Schema.transformOrFail(
  FormDataSchema,
  AccountDataSchema,
  {
    strict: true,
    decode: (formData) =>
      Effect.succeed(Schema.decodeSync(AccountDataSchema)(formData)),
    encode: (accountData) =>
      Effect.succeed(
        Schema.decodeSync(FormDataSchema)(
          Object.assign(accountData, {
            confirmPassword: accountData.password,
          }),
        ),
      ),
  },
);

export const actions = {
  register: async ({ request }) => {
    Effect.runPromise(
      Effect.gen(function* () {
        const unknownFormData = yield* Effect.tryPromise(request.formData).pipe(
          Effect.catchTag("UnknownException", () =>
            Effect.fail(
              new InvalidFormData({ message: "Failed to parse form data" }),
            ),
          ),
        );
        const accountData =
          yield* Schema.decodeUnknown(registerSchema)(unknownFormData);

        // Save accountData to the database here

        json({ data: true });
      }).pipe(
        Effect.catchAll((error) =>
          Effect.succeed(() => {
            fail(422, {
              data: error.message,
            });
          }),
        ),
      ),
    );
  },
};
