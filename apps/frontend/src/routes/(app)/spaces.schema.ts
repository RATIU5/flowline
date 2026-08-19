import * as Schema from "effect/Schema";

/**
 * Shared with the client so `preflight` validates with the same rules.
 * `NonEmptyString` alone accepts "   ", so trim before the length check.
 */
export const CreateSpaceInput = Schema.Struct({
  name: Schema.Trim.pipe(Schema.decodeTo(Schema.NonEmptyString)),
});
