import * as Schema from "effect/Schema";

export const SpaceSchemaGetResponse = Schema.Struct({
  id: Schema.String,
  name: Schema.UndefinedOr(Schema.String),
  createdAt: Schema.UndefinedOr(Schema.DateTimeUtcFromString),
  ownerId: Schema.UndefinedOr(Schema.String),
});
