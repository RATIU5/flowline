import * as Schema from "effect/Schema";

export class SpaceSchemaGetResponse extends Schema.Class<SpaceSchemaGetResponse>(
  "SpaceSchemaGetResponse",
)({
  id: Schema.String,
  name: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.DateTimeUtcFromString),
  ownerId: Schema.optional(Schema.String),
}) {}
