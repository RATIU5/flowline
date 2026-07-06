import * as Schema from "effect/Schema";

export class ChannelRepositoryError extends Schema.ErrorClass<ChannelRepositoryError>(
  "ChannelRepositoryError",
)({
  message: Schema.String,
  function: Schema.String,
  name: Schema.String,
  query: Schema.optional(Schema.String),
}) {}
