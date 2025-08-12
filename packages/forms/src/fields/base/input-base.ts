import { Context, Effect, Layer, Schema, pipe } from "effect";
import { type Field, type FieldConfig, FieldService } from "./field-base.js";
import { FieldError } from "../../core/types.js";

export interface InputTransformConfig<T> {
  readonly inputTransforms?: ReadonlyArray<Schema.Schema<string, string>>;
  readonly parseSchema?: Schema.Schema<T, string>;
}

export interface InputConfig<T> extends FieldConfig<T> {
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly autoComplete?: string;
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly transform?: InputTransformConfig<T>;
  readonly onFocus?: Effect.Effect<void, FieldError>;
  readonly onBlur?: Effect.Effect<void, FieldError>;
}

export interface InputMethods {
  readonly focus: Effect.Effect<void, FieldError>;
  readonly blur: Effect.Effect<void, FieldError>;
  readonly select: Effect.Effect<void, FieldError>;
  readonly clear: Effect.Effect<void, FieldError>;
  readonly isFocused: Effect.Effect<boolean>;
}

export interface InputField<T> extends Field<T>, InputMethods {
  readonly inputConfig: InputConfig<T>;
  readonly setRawValue: (rawValue: string) => Effect.Effect<void, FieldError>;
}

export class InputService extends Effect.Service<InputService>()(
  "@flowline/forms/InputService",
  {
    effect: Effect.gen(function* () {
      const fieldService = yield* FieldService;

      return {
        make: <T>(
          config: InputConfig<T>,
        ): Effect.Effect<InputField<T>, FieldError> =>
          Effect.gen(function* () {
            const baseField = yield* fieldService.make(config);

            const setRawValue = (
              rawValue: string,
            ): Effect.Effect<void, FieldError> =>
              Effect.gen(function* () {
                let processedValue: string = rawValue;

                if (config.transform?.inputTransforms) {
                  for (const transform of config.transform.inputTransforms) {
                    processedValue = yield* pipe(
                      Schema.decodeUnknown(transform)(processedValue),
                      Effect.mapError(
                        (parseError) =>
                          new FieldError({
                            message: `Failed to apply transform: ${parseError.message}`,
                            operation: "setRawValue",
                          }),
                      ),
                    );
                  }
                }

                const parsedValue = config.transform?.parseSchema
                  ? yield* Schema.decodeUnknown(config.transform.parseSchema)(
                      processedValue,
                    ).pipe(
                      Effect.mapError(
                        (err) =>
                          new FieldError({
                            message: err.message,
                            operation: "setRawValue",
                          }),
                      ),
                    )
                  : (processedValue as T);

                yield* baseField.setValue(parsedValue);
              });

            const focus: Effect.Effect<void, FieldError> =
              config.onFocus ?? Effect.succeed(void 0);

            const blur: Effect.Effect<void, FieldError> =
              config.onBlur ?? Effect.succeed(void 0);

            const select: Effect.Effect<void, FieldError> = Effect.succeed(
              void 0,
            );

            const clear: Effect.Effect<void, FieldError> = baseField.setValue(
              config.initialValue,
            );

            const isFocused: Effect.Effect<boolean> = Effect.succeed(false);

            return {
              ...baseField,
              inputConfig: config,
              setRawValue,
              focus,
              blur,
              select,
              clear,
              isFocused,
            };
          }),
      };
    }),
    dependencies: [FieldService.Default],
  },
) {}

export const makeInput = <T>(config: InputConfig<T>) =>
  Effect.gen(function* () {
    const inputService = yield* InputService;
    return yield* inputService.make(config);
  });
