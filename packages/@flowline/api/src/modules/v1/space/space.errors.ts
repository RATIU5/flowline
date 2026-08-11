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

export class NoSpacesForUserError extends Schema.TaggedError<NoSpacesForUserError>()(
  "NoSpacesForUserError",
  {
    message: Schema.String,
  },
  {
    httpApiStatus: 404,
  },
) {}

export const SpaceGetErrors = Schema.Union([
  SpaceNotFound,
  SpaceConflict,
  SpaceInternalError,
  NoSpacesForUserError,
]);

export const SpaceGetByUserErrors = Schema.Union([
  SpaceInternalError,
  NoSpacesForUserError,
]);
