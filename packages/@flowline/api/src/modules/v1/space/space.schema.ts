import * as Schema from "effect/Schema";

export class SpaceSchemaGetResponse extends Schema.Class<SpaceSchemaGetResponse>(
  "SpaceSchemaGetResponse",
)({
  id: Schema.String,
  name: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.DateTimeUtcFromString),
  ownerId: Schema.optional(Schema.String),
}) {}

export class SpacesSchemaGetResponse extends Schema.Class<SpacesSchemaGetResponse>(
  "SpacesSchemaGetResponse",
)({
  spaces: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.optional(Schema.String),
      createdAt: Schema.optional(Schema.DateTimeUtcFromString),
      ownerId: Schema.optional(Schema.String),
    }),
  ),
}) {}
