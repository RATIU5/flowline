import { Effect, Schema, pipe } from "effect";
import { FieldError } from "../core/mod.js";
import { FieldService, type Field, type FieldConfig } from "./field-service.js";

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
}

export interface InputField<T> extends Field<T> {
  readonly inputConfig: InputConfig<T>;
  readonly setRawValue: (rawValue: string) => Effect.Effect<void, FieldError>;
  readonly select: () => Effect.Effect<void>;
  readonly clear: () => Effect.Effect<void, FieldError>;
}

export class InputService extends Effect.Service<InputService>()(
  "@flowline/forms/InputService",
  {
    effect: Effect.gen(function* () {
      const fieldService = yield* FieldService;

      return {
        createInputField: <T>(
          config: InputConfig<T>,
        ): Effect.Effect<InputField<T>, FieldError> =>
          Effect.gen(function* () {
            const baseField = yield* fieldService.createField(config);

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

            const select = (): Effect.Effect<void> => Effect.succeed(void 0);

            const clear = (): Effect.Effect<void, FieldError> =>
              baseField.setValue(config.initialValue);

            return {
              ...baseField,
              inputConfig: config,
              setRawValue,
              select,
              clear,
            };
          }),
      };
    }),
    dependencies: [FieldService.Default],
  },
) {}

export const createInputField = <T>(
  config: InputConfig<T>,
): Effect.Effect<InputField<T>, FieldError, InputService> =>
  Effect.gen(function* () {
    const inputService = yield* InputService;
    return yield* inputService.createInputField(config);
  });
