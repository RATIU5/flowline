import { FormDataSchema } from "$lib/effects/forms";
import { Schema } from "effect";

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

const AccountDataSchema = Schema.Struct({
  displayName: Schema.String.annotations({ default: "" }),
  email: Schema.String.pipe(
    Schema.filter((s) => isEmail(s), {
      message: () => "Must be a valid email",
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

export const RegisterSchema = FormDataSchema(AccountDataSchema);
