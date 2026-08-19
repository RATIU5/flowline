import * as Schema from "effect/Schema";

export class Space extends Schema.Class<Space>("Space")({
  id: Schema.String,
  name: Schema.String,
  ownerId: Schema.String,
  createdAt: Schema.DateTimeUtcFromString,
}) {}
