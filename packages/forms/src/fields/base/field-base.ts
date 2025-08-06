import {
  Context,
  Effect,
  Data,
  Ref,
  Schema,
  Either,
  Option,
  pipe,
} from "effect";

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

export interface FieldState<T> {
  readonly value: T;
  readonly initialValue: T;
  readonly errors: ReadonlyArray<string>;
  readonly isValidating: boolean;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly validationCount: number;
}

export interface FieldConfig<T> {
  readonly initialValue: T;
  readonly required?: boolean;
  readonly schema?: Schema.Schema<T, unknown>;
  readonly debounceMs?: number;
}

export interface FieldMethods<T> {
  readonly getValue: Effect.Effect<T, FieldError>;
  readonly setValue: (value: T) => Effect.Effect<void, FieldError>;
  readonly validate: (value?: T) => Effect.Effect<T, FieldValidationError>;
  readonly reset: Effect.Effect<void, FieldError>;
  readonly getState: Effect.Effect<FieldState<T>, FieldError>;
  readonly isDirty: Effect.Effect<boolean>;
  readonly isValid: Effect.Effect<boolean>;
  readonly getErrors: Effect.Effect<ReadonlyArray<string>>;
}

export interface Field<T> {
  readonly config: FieldConfig<T>;
  readonly state: Ref.Ref<FieldState<T>>;
  readonly getValue: Effect.Effect<T, FieldError>;
  readonly setValue: (value: T) => Effect.Effect<void, FieldError>;
  readonly validate: (value?: T) => Effect.Effect<T, FieldValidationError>;
  readonly reset: Effect.Effect<void, FieldError>;
  readonly getState: Effect.Effect<FieldState<T>, FieldError>;
  readonly isDirty: Effect.Effect<boolean>;
  readonly isValid: Effect.Effect<boolean>;
  readonly getErrors: Effect.Effect<ReadonlyArray<string>>;
}

export class FieldService extends Context.Tag("@flowline/forms/FieldService")<
  FieldService,
  {
    readonly make: <T>(config: FieldConfig<T>) => Effect.Effect<Field<T>>;
  }
>() {}

export const makeField = <T>(config: FieldConfig<T>): Effect.Effect<Field<T>> =>
  Effect.gen(function* () {
    const initialState: FieldState<T> = {
      value: config.initialValue,
      initialValue: config.initialValue,
      errors: [],
      isValidating: false,
      isDirty: false,
      isValid: true,
      validationCount: 0,
    };

    const stateRef = yield* Ref.make(initialState);

    const getValue: Effect.Effect<T, FieldError> = pipe(
      Ref.get(stateRef),
      Effect.map((state) => state.value),
      Effect.catchAll((error) =>
        Effect.fail(
          new FieldError({
            message: `Failed to get value: ${error}`,
            operation: "getValue",
          }),
        ),
      ),
    );

    const setValue = (value: T): Effect.Effect<void, FieldError> =>
      Effect.gen(function* () {
        const currentState = yield* Ref.get(stateRef);

        yield* Ref.set(stateRef, {
          ...currentState,
          value,
          isDirty: !Object.is(value, currentState.initialValue),
          validationCount: currentState.validationCount + 1,
        });
      }).pipe(
        Effect.catchAll((error) =>
          Effect.fail(
            new FieldError({
              message: `Failed to set value: ${error}`,
              operation: "setValue",
            }),
          ),
        ),
      );

    const validate = (value?: T): Effect.Effect<T, FieldValidationError> =>
      Effect.gen(function* () {
        const currentState = yield* Ref.get(stateRef);
        const valueToValidate = value ?? currentState.value;

        yield* Ref.update(stateRef, (state) => ({
          ...state,
          isValidating: true,
        }));

        let validationResult: Either.Either<T, FieldValidationError>;

        if (
          config.required &&
          (valueToValidate === undefined ||
            valueToValidate === null ||
            valueToValidate === "")
        ) {
          validationResult = Either.left(
            new FieldValidationError({
              message: "This field is required",
              code: "REQUIRED",
            }),
          );
        } else if (config.schema) {
          validationResult = yield* Effect.either(
            Schema.decodeUnknown(config.schema)(valueToValidate).pipe(
              Effect.mapError(
                (error) =>
                  new FieldValidationError({
                    message: error.message || "Validation failed",
                    code: "SCHEMA_VALIDATION",
                  }),
              ),
            ),
          );
        } else {
          validationResult = Either.right(valueToValidate);
        }

        const isValid = Either.isRight(validationResult);
        const errors = Either.isLeft(validationResult)
          ? [validationResult.left.message]
          : [];

        yield* Ref.update(stateRef, (state) => ({
          ...state,
          isValidating: false,
          isValid,
          errors,
        }));

        return Either.isRight(validationResult)
          ? validationResult.right
          : yield* Effect.fail(validationResult.left);
      });

    const reset: Effect.Effect<void, FieldError> = Ref.set(
      stateRef,
      initialState,
    ).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new FieldError({
            message: `Failed to reset: ${error}`,
            operation: "reset",
          }),
        ),
      ),
    );

    const getState: Effect.Effect<FieldState<T>, FieldError> = Ref.get(
      stateRef,
    ).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new FieldError({
            message: `Failed to get state: ${error}`,
            operation: "getState",
          }),
        ),
      ),
    );

    const isDirty: Effect.Effect<boolean> = pipe(
      Ref.get(stateRef),
      Effect.map((state) => state.isDirty),
      Effect.orElse(() => Effect.succeed(false)),
    );

    const isValid: Effect.Effect<boolean> = pipe(
      Ref.get(stateRef),
      Effect.map((state) => state.isValid),
      Effect.orElse(() => Effect.succeed(false)),
    );

    const getErrors: Effect.Effect<ReadonlyArray<string>, never> = pipe(
      Ref.get(stateRef),
      Effect.map((state) => state.errors),
      Effect.orElse(() => Effect.succeed([])),
    );

    return {
      config,
      state: stateRef,
      getValue,
      setValue,
      validate,
      reset,
      getState,
      isDirty,
      isValid,
      getErrors,
    };
  });

// Service implementation for dependency injection
export const FieldServiceLive = FieldService.of({
  make: makeField,
});
