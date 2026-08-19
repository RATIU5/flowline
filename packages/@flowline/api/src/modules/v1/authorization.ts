import * as Context from "effect/Context";
import * as Schema from "effect/Schema";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

/** The authenticated caller, provided by the `Authorization` middleware. */
export class CurrentUser extends Context.Service<
  CurrentUser,
  { readonly id: string }
>()("@flowline/api/v1/CurrentUser") {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  { message: Schema.String },
  { httpApiStatus: 401 },
) {}

/**
 * Declares that a group runs behind authentication. The server supplies the
 * implementation (session lookup); clients only need to send their credentials.
 */
export class Authorization extends HttpApiMiddleware.Service<
  Authorization,
  { provides: CurrentUser; requires: never }
>()("@flowline/api/v1/Authorization", { error: Unauthorized }) {}
