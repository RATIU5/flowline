import * as Schema from "effect/Schema";

export class SpaceRepositoryError extends Schema.ErrorClass<SpaceRepositoryError>(
  "SpaceRepositoryError",
)({
  message: Schema.String,
  function: Schema.String,
  name: Schema.String,
  query: Schema.optional(Schema.String),
}) {}
