import { BASE_ERROR_CODES } from "better-auth";
import * as Schema from "effect/Schema";

import { objectKeys } from "../../lib/utils";

export class AuthUnknownError extends Schema.TaggedError<AuthUnknownError>()(
  "AuthUnknownError",
  {
    message: Schema.String,
    name: Schema.String,
  },
) {}

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  message: Schema.String,
  name: Schema.String,
}) {}

export class AuthApiError extends Schema.TaggedError<AuthApiError>()(
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
