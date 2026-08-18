import * as Schema from "effect/Schema";

export class SpaceSchemaGetResponse extends Schema.Class<SpaceSchemaGetResponse>(
  "SpaceSchemaGetResponse",
)({
  data: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    createdAt: Schema.optional(Schema.DateTimeUtcFromString),
    ownerId: Schema.optional(Schema.String),
  }),
}) {}

export class SpacesSchemaGetResponse extends Schema.Class<SpacesSchemaGetResponse>(
  "SpacesSchemaGetResponse",
)({
  data: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.optional(Schema.String),
      createdAt: Schema.optional(Schema.DateTimeUtcFromString),
      ownerId: Schema.optional(Schema.String),
    }),
  ),
}) {}

export class SpacesSchemaCreateResponse extends Schema.Class<SpacesSchemaCreateResponse>(
  "SpacesSchemaCreateResponse",
)({
  data: Schema.Struct({
    id: Schema.String,
  }),
}) {}
