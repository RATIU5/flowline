import * as Schema from "effect/Schema";

export class SpaceNotFound extends Schema.TaggedError<SpaceNotFound>()(
  "SpaceNotFound",
  {
    message: Schema.String,
  },
  { httpApiStatus: 404 },
) {}

export class SpaceConflict extends Schema.TaggedError<SpaceConflict>()(
  "SpaceConflict",
  {
    message: Schema.String,
  },
  {
    httpApiStatus: 409,
  },
) {}

export class SpaceInternalError extends Schema.TaggedError<SpaceInternalError>()(
  "SpaceInternalError",
  {
    message: Schema.String,
  },
  {
    httpApiStatus: 500,
  },
) {}
