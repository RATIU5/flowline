import * as Schema from "effect/Schema";

export class SpaceNotFound extends Schema.TaggedError<SpaceNotFound>()(
  "SpaceNotFound",
  { message: Schema.String },
  { httpApiStatus: 404 },
) {}
