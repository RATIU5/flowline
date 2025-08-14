import { Data } from "effect";

export class FieldValidationError extends Data.TaggedError(
  "@flowline/forms/FieldBase/ValidationError",
)<{
  readonly message: string;
  readonly name: string;
  readonly path?: ReadonlyArray<string>;
  readonly code?: string;
}> {}

export class FieldError extends Data.TaggedError(
  "@flowline/forms/FieldBase/FieldError",
)<{
  readonly message: string;
  readonly operation: string;
}> {}

export const findErrorsByFieldName = (
  errors: ReadonlyArray<FieldValidationError>,
  name: string,
): ReadonlyArray<FieldValidationError> =>
  errors.filter((error) => error.name === name);

export const findErrorsByFieldPath = (
  errors: ReadonlyArray<FieldValidationError>,
  path: ReadonlyArray<string>,
): ReadonlyArray<FieldValidationError> =>
  errors.filter(
    (error) =>
      error.path !== undefined &&
      error.path.length === path.length &&
      error.path.every((segment, index) => segment === path[index]),
  );

export const groupErrorsByField = (
  errors: ReadonlyArray<FieldValidationError>,
): ReadonlyMap<string, ReadonlyArray<FieldValidationError>> => {
  const map = new Map<string, FieldValidationError[]>();

  for (const error of errors) {
    const key = error.path ? error.path.join(".") : error.name;
    const existing = map.get(key) || [];
    map.set(key, [...existing, error]);
  }

  return new Map(
    [...map.entries()].map(([k, v]) => [
      k,
      v as ReadonlyArray<FieldValidationError>,
    ]),
  );
};

export class FormSubmissionError extends Data.TaggedError(
  "@flowline/forms/Form/SubmissionError",
)<{
  readonly message: string;
  readonly errors: ReadonlyArray<FieldValidationError>;
}> {}

export const hasFieldErrors = (
  errors: ReadonlyArray<FieldValidationError>,
  name: string,
  path?: ReadonlyArray<string>,
): boolean => {
  if (path) {
    return findErrorsByFieldPath(errors, path).length > 0;
  }
  return findErrorsByFieldName(errors, name).length > 0;
};
