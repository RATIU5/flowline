import {
  Effect,
  SubscriptionRef,
  Schema,
  Record,
  Stream,
  pipe,
  Equal,
} from "effect";
import { FieldError, FieldValidationError } from "../core/mod.js";
import { FieldService } from "./field-service.js";

export interface FormConfig<T extends Record.ReadonlyRecord<string, unknown>> {
  readonly name: string;
  readonly resetOnSubmit?: boolean;
  readonly validateOnChange?: boolean;
  readonly validateOnBlur?: boolean;
  readonly validateOnSubmit?: boolean;
  readonly debounceMs?: number;
  readonly validations?: {
    readonly [K in keyof T]?: Schema.Schema<T[K], unknown>;
  };
}

export interface FormState<T extends Record.ReadonlyRecord<string, unknown>> {
  readonly values: T;
  readonly initialValues: T;
  readonly errors: Record.ReadonlyRecord<
    string,
    ReadonlyArray<FieldValidationError>
  >;
  readonly isSubmitting: boolean;
  readonly isValidating: boolean;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly submitCount: number;
  readonly validationCount: number;
  readonly touched: Record.ReadonlyRecord<string, boolean>;
}

export interface FormSubmissionResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors?: Record.ReadonlyRecord<
    string,
    ReadonlyArray<FieldValidationError>
  >;
}

export interface Form<T extends Record.ReadonlyRecord<string, unknown>> {
  readonly config: FormConfig<T>;
  readonly stateStream: Stream.Stream<FormState<T>, never>;
  readonly getState: () => Effect.Effect<FormState<T>, FieldError>;
  readonly getValues: () => Effect.Effect<T, FieldError>;
  readonly setValues: (values: Partial<T>) => Effect.Effect<void, FieldError>;
  readonly validate: (
    values?: Partial<T>,
  ) => Effect.Effect<T, FieldValidationError>;
  readonly validateField: <K extends keyof T>(
    name: K,
    value?: T[K],
  ) => Effect.Effect<T[K], FieldValidationError>;
  readonly submit: <R, R2>(
    onSubmit: (values: T) => Effect.Effect<R, FieldValidationError, R2>,
  ) => Effect.Effect<FormSubmissionResult<R>, FieldError, R2>;
  readonly reset: () => Effect.Effect<void, FieldError>;
  readonly isDirty: () => Effect.Effect<boolean>;
  readonly isValid: () => Effect.Effect<boolean>;
  readonly isSubmitting: () => Effect.Effect<boolean>;
  readonly getErrors: () => Effect.Effect<
    Record.ReadonlyRecord<string, ReadonlyArray<string>>
  >;
  readonly getFieldErrors: <K extends keyof T>(
    name: K,
  ) => Effect.Effect<ReadonlyArray<string>>;
  readonly touch: <K extends keyof T>(
    name: K,
  ) => Effect.Effect<void, FieldError>;
  readonly untouch: <K extends keyof T>(
    name: K,
  ) => Effect.Effect<void, FieldError>;
  readonly isTouched: <K extends keyof T>(name: K) => Effect.Effect<boolean>;
}

export class FormService extends Effect.Service<FormService>()(
  "@flowline/forms/FormService",
  {
    effect: Effect.gen(function* () {
      yield* FieldService;

      return {
        createForm: <T extends Record.ReadonlyRecord<string, unknown>>(
          config: FormConfig<T>,
          initialValues: T,
        ): Effect.Effect<Form<T>, FieldError> =>
          Effect.gen(function* () {
            const initialState: FormState<T> = {
              values: initialValues,
              initialValues,
              errors: {},
              isSubmitting: false,
              isValidating: false,
              isDirty: false,
              isValid: true,
              submitCount: 0,
              validationCount: 0,
              touched: {},
            };

            const stateRef = yield* SubscriptionRef.make(initialState);

            const stateStream = config.debounceMs
              ? stateRef.changes.pipe(
                  Stream.debounce(`${config.debounceMs} millis`),
                )
              : stateRef.changes;

            const getState = (): Effect.Effect<FormState<T>, FieldError> =>
              pipe(
                SubscriptionRef.get(stateRef),
                Effect.catchAll((error) =>
                  Effect.fail(
                    new FieldError({
                      message: `Failed to get form state: ${error}`,
                      operation: "getState",
                    }),
                  ),
                ),
              );

            const getValues = (): Effect.Effect<T, FieldError> =>
              pipe(
                SubscriptionRef.get(stateRef),
                Effect.map((state) => state.values),
                Effect.catchAll((error) =>
                  Effect.fail(
                    new FieldError({
                      message: `Failed to get values: ${error}`,
                      operation: "getValues",
                    }),
                  ),
                ),
              );

            const setValues = (
              values: Partial<T>,
            ): Effect.Effect<void, FieldError> =>
              Effect.gen(function* () {
                const currentState = yield* SubscriptionRef.get(stateRef);
                const newValues = { ...currentState.values, ...values };

                yield* SubscriptionRef.update(stateRef, (state) => ({
                  ...state,
                  values: newValues,
                  isDirty: !Equal.equals(newValues, state.initialValues),
                  validationCount: state.validationCount + 1,
                }));

                if (config.validateOnChange) {
                  yield* Effect.either(validate(newValues));
                }
              }).pipe(
                Effect.catchAll((error) =>
                  Effect.fail(
                    new FieldError({
                      message: `Failed to set values: ${error}`,
                      operation: "setValues",
                    }),
                  ),
                ),
              );

            const validate = (
              values?: Partial<T>,
            ): Effect.Effect<T, FieldValidationError> =>
              Effect.gen(function* () {
                const currentState = yield* SubscriptionRef.get(stateRef);
                const valuesToValidate = values
                  ? { ...currentState.values, ...values }
                  : currentState.values;

                yield* SubscriptionRef.update(stateRef, (state) => ({
                  ...state,
                  isValidating: true,
                }));

                if (!config.validations) {
                  yield* SubscriptionRef.update(stateRef, (state) => ({
                    ...state,
                    isValidating: false,
                    isValid: true,
                    errors: {},
                    validationCount: state.validationCount + 1,
                  }));
                  return valuesToValidate;
                }

                const errorEntries: Array<
                  [string, ReadonlyArray<FieldValidationError>]
                > = [];
                let hasErrors = false;

                for (const [fieldName, schema] of Record.toEntries(
                  config.validations,
                )) {
                  if (!schema) continue;

                  const fieldValue = valuesToValidate[fieldName];

                  const validationResult = yield* Effect.either(
                    Schema.decodeUnknown(schema)(fieldValue).pipe(
                      Effect.mapError(
                        (error) =>
                          new FieldValidationError({
                            message: error.message || "Validation failed",
                            name: fieldName,
                            code: "SCHEMA_VALIDATION",
                          }),
                      ),
                    ),
                  );

                  if (validationResult._tag === "Left") {
                    errorEntries.push([fieldName, [validationResult.left]]);
                    hasErrors = true;
                  }
                }

                const errors = Record.fromEntries(errorEntries);

                yield* SubscriptionRef.update(stateRef, (state) => ({
                  ...state,
                  isValidating: false,
                  isValid: !hasErrors,
                  errors,
                  validationCount: state.validationCount + 1,
                }));

                if (hasErrors) {
                  const firstError = errorEntries[0]?.[1]?.[0];
                  return yield* Effect.fail(
                    firstError ||
                      new FieldValidationError({
                        message: "Validation failed",
                        name: "form",
                        code: "VALIDATION_FAILED",
                      }),
                  );
                }

                return valuesToValidate;
              });

            const validateField = <K extends keyof T>(
              name: K,
              value?: T[K],
            ): Effect.Effect<T[K], FieldValidationError> =>
              Effect.gen(function* () {
                const schema = config.validations?.[name];
                if (!schema) {
                  const currentState = yield* SubscriptionRef.get(stateRef);
                  return value !== undefined
                    ? value
                    : currentState.values[name];
                }

                const currentState = yield* SubscriptionRef.get(stateRef);
                const valueToValidate =
                  value !== undefined ? value : currentState.values[name];

                return yield* Schema.decodeUnknown(schema)(
                  valueToValidate,
                ).pipe(
                  Effect.mapError(
                    (error) =>
                      new FieldValidationError({
                        message: error.message || "Validation failed",
                        name: String(name),
                        code: "SCHEMA_VALIDATION",
                      }),
                  ),
                );
              });

            const submit = <R, R2>(
              onSubmit: (
                values: T,
              ) => Effect.Effect<R, FieldValidationError, R2>,
            ): Effect.Effect<FormSubmissionResult<R>, FieldError, R2> =>
              Effect.gen(function* () {
                yield* SubscriptionRef.update(stateRef, (state) => ({
                  ...state,
                  isSubmitting: true,
                }));

                const validationResult = yield* Effect.either(validate());

                if (validationResult._tag === "Left") {
                  yield* SubscriptionRef.update(stateRef, (state) => ({
                    ...state,
                    isSubmitting: false,
                    submitCount: state.submitCount + 1,
                  }));

                  return {
                    success: false,
                    errors: Record.fromEntries([
                      ["form", [validationResult.left]],
                    ]),
                  };
                }

                const submitResult = yield* Effect.either(
                  onSubmit(validationResult.right),
                );

                yield* SubscriptionRef.update(stateRef, (state) => ({
                  ...state,
                  isSubmitting: false,
                  submitCount: state.submitCount + 1,
                }));

                if (submitResult._tag === "Left") {
                  return {
                    success: false,
                    errors: Record.fromEntries([
                      ["submit", [submitResult.left]],
                    ]),
                  };
                }

                if (config.resetOnSubmit) {
                  yield* reset();
                }

                return {
                  success: true,
                  data: submitResult.right,
                };
              }).pipe(
                Effect.catchAll((error) =>
                  Effect.fail(
                    new FieldError({
                      message: `Failed to submit form: ${error}`,
                      operation: "submit",
                    }),
                  ),
                ),
              );

            const reset = (): Effect.Effect<void, FieldError> =>
              SubscriptionRef.set(stateRef, initialState).pipe(
                Effect.catchAll((error) =>
                  Effect.fail(
                    new FieldError({
                      message: `Failed to reset form: ${error}`,
                      operation: "reset",
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

            const isSubmitting = (): Effect.Effect<boolean> =>
              pipe(
                SubscriptionRef.get(stateRef),
                Effect.map((state) => state.isSubmitting),
                Effect.orElse(() => Effect.succeed(false)),
              );

            const getErrors = (): Effect.Effect<
              Record.ReadonlyRecord<string, ReadonlyArray<string>>
            > =>
              pipe(
                SubscriptionRef.get(stateRef),
                Effect.map((state) =>
                  Record.map(state.errors, (errors) =>
                    errors.map((e) => e.message),
                  ),
                ),
                Effect.orElse(() => Effect.succeed({})),
              );

            const getFieldErrors = <K extends keyof T>(
              name: K,
            ): Effect.Effect<ReadonlyArray<string>> =>
              pipe(
                SubscriptionRef.get(stateRef),
                Effect.map(
                  (state) =>
                    state.errors[name as string]?.map((e) => e.message) || [],
                ),
                Effect.orElse(() => Effect.succeed([])),
              );

            const touch = <K extends keyof T>(
              name: K,
            ): Effect.Effect<void, FieldError> =>
              SubscriptionRef.update(stateRef, (state) => ({
                ...state,
                touched: { ...state.touched, [name as string]: true },
              })).pipe(
                Effect.catchAll((error) =>
                  Effect.fail(
                    new FieldError({
                      message: `Failed to touch field ${String(name)}: ${error}`,
                      operation: "touch",
                    }),
                  ),
                ),
              );

            const untouch = <K extends keyof T>(
              name: K,
            ): Effect.Effect<void, FieldError> =>
              SubscriptionRef.update(stateRef, (state) => ({
                ...state,
                touched: { ...state.touched, [name as string]: false },
              })).pipe(
                Effect.catchAll((error) =>
                  Effect.fail(
                    new FieldError({
                      message: `Failed to untouch field ${String(name)}: ${error}`,
                      operation: "untouch",
                    }),
                  ),
                ),
              );

            const isTouched = <K extends keyof T>(
              name: K,
            ): Effect.Effect<boolean> =>
              pipe(
                SubscriptionRef.get(stateRef),
                Effect.map((state) => state.touched[name as string] ?? false),
                Effect.orElse(() => Effect.succeed(false)),
              );

            return {
              config,
              stateStream,
              getState,
              getValues,
              setValues,
              validate,
              validateField,
              submit,
              reset,
              isDirty,
              isValid,
              isSubmitting,
              getErrors,
              getFieldErrors,
              touch,
              untouch,
              isTouched,
            };
          }),
      };
    }),
    dependencies: [FieldService.Default],
  },
) {}

export const createForm = <T extends Record.ReadonlyRecord<string, unknown>>(
  config: FormConfig<T>,
  initialValues: T,
): Effect.Effect<Form<T>, FieldError, FormService> =>
  Effect.gen(function* () {
    const formService = yield* FormService;
    return yield* formService.createForm(config, initialValues);
  });
