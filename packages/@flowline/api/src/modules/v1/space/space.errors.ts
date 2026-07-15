import * as Schema from "effect/Schema";

export class SpaceNotFound extends Schema.TaggedErrorClass<SpaceNotFound>()(
  "SpaceNotFound",
  {
    message: Schema.String,
  },
  { httpApiStatus: 404 },
) {}

export class SpaceConflict extends Schema.TaggedErrorClass<SpaceConflict>()(
  "SpaceConflict",
  {
    message: Schema.String,
  },
  {
    httpApiStatus: 409,
  },
) {}

export class SpaceInternalError extends Schema.TaggedErrorClass<SpaceInternalError>()(
  "SpaceInternalError",
  {
    message: Schema.String,
  },
  {
    httpApiStatus: 500,
  },
) {}
