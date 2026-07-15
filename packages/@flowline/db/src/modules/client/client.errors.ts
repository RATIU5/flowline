import * as Schema from "effect/Schema";

export class DatabaseClientError extends Schema.TaggedErrorClass<DatabaseClientError>()(
  "DatabaseClientError",
  {
    message: Schema.String,
    name: Schema.String,
    query: Schema.optional(Schema.String),
  },
) {}
