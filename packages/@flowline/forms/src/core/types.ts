import type { FieldValidationError } from "./errors";

export interface FieldState<T> {
  readonly value: T;
  readonly initialValue: T;
  readonly errors: ReadonlyArray<FieldValidationError>;
  readonly isValidating: boolean;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly validationCount: number;
  readonly isFocused?: boolean;
  readonly isTouched: boolean;
}
