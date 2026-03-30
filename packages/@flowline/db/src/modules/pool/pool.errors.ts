import * as Schema from "effect/Schema";

export class DatabasePoolEndError extends Schema.ErrorClass<DatabasePoolEndError>(
  "DatabaseClientError",
)({
  message: Schema.String,
  error: Schema.Any,
}) {}
