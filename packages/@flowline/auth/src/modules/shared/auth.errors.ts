import { BASE_ERROR_CODES, type APIErrorCode } from "better-auth";
import * as Schema from "effect/Schema";

import { objectKeys } from "../../lib/utils";

export const isErrorCode = (code: unknown): code is APIErrorCode =>
  typeof code === "string" && code in BASE_ERROR_CODES;

export class AuthUnknownError extends Schema.TaggedErrorClass<AuthUnknownError>()(
  "AuthUnknownError",
  {
    message: Schema.String,
    name: Schema.String,
  },
) {}

export class AuthError extends Schema.TaggedErrorClass<AuthError>()(
  "AuthError",
  {
    message: Schema.String,
    name: Schema.String,
  },
) {}

export class AuthApiError extends Schema.TaggedErrorClass<AuthApiError>()(
  "AuthApiError",
  {
    message: Schema.String,
    name: Schema.String,
    status: Schema.Literals([
      ...objectKeys(BASE_ERROR_CODES),
      "UNSPECIFIED_ERROR",
    ]),
  },
) {}
