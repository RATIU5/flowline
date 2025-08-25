import { Effect, SubscriptionRef, Schema, Either, Stream, pipe } from "effect";
import {
  FieldValidationError,
  FieldError,
  type FieldState,
} from "../core/mod.js";

export interface FieldConfig<T> {
  readonly name: string;
  readonly initialValue: T;
  readonly path?: ReadonlyArray<string>;
  readonly required?: boolean;
  readonly schema?: Schema.Schema<T, unknown>;
  readonly debounceMs?: number;
}

export interface Field<T> {
  readonly config: FieldConfig<T>;
  readonly stateStream: Stream.Stream<FieldState<T>, never>;
  readonly getValue: () => Effect.Effect<T, FieldError>;
  readonly setValue: (value: T) => Effect.Effect<void, FieldError>;
  readonly validate: (value?: T) => Effect.Effect<T, FieldValidationError>;
  readonly reset: () => Effect.Effect<void, FieldError>;
  readonly getState: () => Effect.Effect<FieldState<T>, FieldError>;
  readonly isDirty: () => Effect.Effect<boolean>;
  readonly isValid: () => Effect.Effect<boolean>;
  readonly isFocused: () => Effect.Effect<boolean>;
  readonly focus: () => Effect.Effect<void>;
  readonly blur: () => Effect.Effect<void>;
  readonly getErrors: () => Effect.Effect<ReadonlyArray<string>>;
}

export class FieldService extends Effect.Service<FieldService>()(
  "@flowline/forms/FieldService",
  {
    effect: Effect.succeed({
      createField: <T>(
        config: FieldConfig<T>,
      ): Effect.Effect<Field<T>, FieldError> =>
        Effect.gen(function* () {
          const initialState: FieldState<T> = {
            value: config.initialValue,
            initialValue: config.initialValue,
            errors: [],
            isValidating: false,
            isDirty: false,
            isValid: true,
            validationCount: 0,
            isFocused: false,
            isTouched: false,
          };

          const stateRef = yield* SubscriptionRef.make(initialState);

          const stateStream = config.debounceMs
            ? stateRef.changes.pipe(
                Stream.debounce(`${config.debounceMs} millis`),
              )
            : stateRef.changes;

          const getValue = (): Effect.Effect<T, FieldError> =>
            pipe(
              SubscriptionRef.get(stateRef),
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
              const currentState = yield* SubscriptionRef.get(stateRef);

              yield* SubscriptionRef.set(stateRef, {
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

          const validate = (
            value?: T,
          ): Effect.Effect<T, FieldValidationError> =>
            Effect.gen(function* () {
              const currentState = yield* SubscriptionRef.get(stateRef);
              const valueToValidate = value ?? currentState.value;

              yield* SubscriptionRef.update(stateRef, (state) => ({
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
                    name: config.name,
                    path: config.path,
                    code: "REQUIRED",
                  }),
                );
              } else if (config.schema) {
                validationResult = yield* Effect.either(
                  Schema.decodeUnknown(config.schema)(valueToValidate).pipe(
                    Effect.mapError((error) => {
                      // Enhanced error handling with better context
                      const parseError = error as any;
                      const issues = parseError.message
                        ? parseError.message
                            .split("\n")
                            .filter((line: any) => line.trim())
                        : ["Validation failed"];

                      return new FieldValidationError({
                        message:
                          issues[issues.length - 1] || "Validation failed",
                        name: config.name,
                        path: config.path,
                        code: "SCHEMA_VALIDATION",
                      });
                    }),
                  ),
                );
              } else {
                validationResult = Either.right(valueToValidate);
              }

              const isValid = Either.isRight(validationResult);
              const errors = Either.isLeft(validationResult)
                ? [validationResult.left]
                : [];

              yield* SubscriptionRef.update(stateRef, (state) => ({
                ...state,
                isValidating: false,
                isValid,
                errors,
              }));

              return Either.isRight(validationResult)
                ? validationResult.right
                : yield* Effect.fail(validationResult.left);
            });

          const reset = (): Effect.Effect<void, FieldError> =>
            SubscriptionRef.set(stateRef, initialState).pipe(
              Effect.catchAll((error) =>
                Effect.fail(
                  new FieldError({
                    message: `Failed to reset: ${error}`,
                    operation: "reset",
                  }),
                ),
              ),
            );

          const getState = (): Effect.Effect<FieldState<T>, FieldError> =>
            SubscriptionRef.get(stateRef).pipe(
              Effect.catchAll((error) =>
                Effect.fail(
                  new FieldError({
                    message: `Failed to get state: ${error}`,
                    operation: "getState",
                  }),
                ),
              ),
            );

          const isDirty = (): Effect.Effect<boolean> =>
            pipe(
              SubscriptionRef.get(stateRef),
              Effect.map((state) => state.isDirty),
              Effect.orElse(() => Effect.succeed(false)),
            );

          const isValid = (): Effect.Effect<boolean> =>
            pipe(
              SubscriptionRef.get(stateRef),
              Effect.map((state) => state.isValid),
              Effect.orElse(() => Effect.succeed(false)),
            );

          const isFocused = (): Effect.Effect<boolean> =>
            pipe(
              SubscriptionRef.get(stateRef),
              Effect.map((state) => state.isFocused ?? false),
              Effect.orElse(() => Effect.succeed(false)),
            );

          const focus = (): Effect.Effect<void> =>
            SubscriptionRef.update(stateRef, (state) => ({
              ...state,
              isFocused: true,
            }));

          const blur = (): Effect.Effect<void> =>
            SubscriptionRef.update(stateRef, (state) => ({
              ...state,
              isFocused: false,
            }));

          const getErrors = (): Effect.Effect<ReadonlyArray<string>, never> =>
            pipe(
              SubscriptionRef.get(stateRef),
              Effect.map((state) => state.errors.map((e) => e.message)),
              Effect.orElse(() => Effect.succeed([])),
            );

          return {
            config,
            stateStream,
            getValue,
            setValue,
            validate,
            reset,
            getState,
            isDirty,
            isValid,
            isFocused,
            focus,
            blur,
            getErrors,
          };
        }),
    }),
    dependencies: [],
  },
) {}
