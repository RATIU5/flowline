import * as Schema from "effect/Schema";

const fields = { message: Schema.String };

export class NoGetRows extends Schema.TaggedError<NoGetRows>()(
  "NoGetRows",
  fields,
) {}
export class TooManyGetRows extends Schema.TaggedError<TooManyGetRows>()(
  "TooManyGetRows",
  fields,
) {}
export class NoSpacesForUserId extends Schema.TaggedError<NoSpacesForUserId>()(
  "NoSpacesForUserId",
  fields,
) {}
export class NoCreateRows extends Schema.TaggedError<NoCreateRows>()(
  "NoCreateRows",
  fields,
) {}
export class TooManyCreateRows extends Schema.TaggedError<TooManyCreateRows>()(
  "TooManyCreateRows",
  fields,
) {}
export class NoUpdateRows extends Schema.TaggedError<NoUpdateRows>()(
  "NoUpdateRows",
  fields,
) {}
export class TooManyUpdateRows extends Schema.TaggedError<TooManyUpdateRows>()(
  "TooManyUpdateRows",
  fields,
) {}
export class NoDeletedRows extends Schema.TaggedError<NoDeletedRows>()(
  "NoDeletedRows",
  fields,
) {}
export class TooManyDeletedRows extends Schema.TaggedError<TooManyDeletedRows>()(
  "TooManyDeletedRows",
  fields,
) {}

export const SpaceReason = Schema.Union([
  NoGetRows,
  TooManyGetRows,
  NoSpacesForUserId,
  NoCreateRows,
  TooManyCreateRows,
  NoUpdateRows,
  TooManyUpdateRows,
  NoDeletedRows,
  TooManyDeletedRows,
]);

export type SpaceReason = typeof SpaceReason.Type;

export class SpaceRepositoryError extends Schema.TaggedError<SpaceRepositoryError>()(
  "SpaceRepositoryError",
  {
    reason: SpaceReason,
    query: Schema.optional(Schema.String),
  },
) {}

/** `SpaceRepositoryError` narrowed to the reasons one repository method can raise. */
export type SpaceRepositoryErrorOf<R extends SpaceReason> =
  SpaceRepositoryError & { readonly reason: R };

/**
 * Builds a `SpaceRepositoryError` whose static type remembers which reason it
 * carries, so each repository method can declare only the reasons it raises.
 */
export const spaceError = <R extends SpaceReason>(
  reason: R,
  query?: string,
): SpaceRepositoryErrorOf<R> =>
  // SAFETY: the instance is constructed from `reason` itself, so its runtime
  // `reason` is exactly `R`; the cast only recovers what the class constructor
  // widens to the full union.
  new SpaceRepositoryError({ reason, query }) as SpaceRepositoryErrorOf<R>;
