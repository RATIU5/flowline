import { Data } from "effect";

// Core error types that can be shared across all field types
export class FieldValidationError extends Data.TaggedError(
  "@flowline/forms/FieldBase/ValidationError",
)<{
  readonly message: string;
  readonly path?: ReadonlyArray<string>;
  readonly code?: string;
}> {}

export class FieldError extends Data.TaggedError(
  "@flowline/forms/FieldBase/FieldError",
)<{
  readonly message: string;
  readonly operation: string;
}> {}

// Common field state interface
export interface FieldState<T> {
  readonly value: T;
  readonly initialValue: T;
  readonly errors: ReadonlyArray<FieldValidationError>;
  readonly isValidating: boolean;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly validationCount: number;
}
