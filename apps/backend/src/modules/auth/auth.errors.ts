import { BASE_ERROR_CODES, type APIErrorCode } from "better-auth";
import * as Schema from "effect/Schema";

import { objectKeys } from "../../lib/utils";

export const isErrorCode = (code: unknown): code is APIErrorCode =>
  typeof code === "string" && code in BASE_ERROR_CODES;

export class BetterAuthUnknownError extends Schema.TaggedErrorClass<BetterAuthUnknownError>()(
  "BetterAuthUnknownError",
  {
    message: Schema.String,
    name: Schema.String,
  },
) {}

export class BetterAuthError extends Schema.TaggedErrorClass<BetterAuthError>()(
  "BetterAuthError",
  {
    message: Schema.String,
    name: Schema.String,
  },
) {}

export class BetterAuthApiError extends Schema.TaggedErrorClass<BetterAuthApiError>()(
  "BetterAuthApiError",
  {
    message: Schema.String,
    name: Schema.String,
    status: Schema.Literals([
      ...objectKeys(BASE_ERROR_CODES),
      "UNSPECIFIED_ERROR",
    ]),
  },
) {}
