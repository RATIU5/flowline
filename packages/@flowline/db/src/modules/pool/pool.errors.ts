import * as Schema from "effect/Schema";

export class DatabasePoolEndError extends Schema.Error<DatabasePoolEndError>(
  "DatabaseClientError",
)({
  message: Schema.String,
  error: Schema.Any,
}) {}
