import { Context, Effect, Layer, Schema } from "effect";
import {
  type InputConfig,
  type InputField,
  type InputTransformConfig,
  InputService,
} from "../base/input-base.js";
import type { FieldError } from "../../core/types.js";

export interface TextFieldConfig
  extends Omit<InputConfig<string>, "initialValue"> {
  readonly initialValue?: string;
  readonly trim?: boolean;
  readonly lowercase?: boolean;
  readonly uppercase?: boolean;
  readonly capitalize?: boolean;
  readonly stripNonAlphabetic?: boolean;
  readonly stripNonNumeric?: boolean;
  readonly customTransforms?: ReadonlyArray<Schema.Schema<string, string>>;
}

export interface TextField extends InputField<string> {
  readonly textConfig: TextFieldConfig;
}

const buildTextTransforms = (
  config: TextFieldConfig,
): InputTransformConfig<string> => {
  const inputTransforms: Array<Schema.Schema<string, string>> = [];

  if (config.trim) {
    inputTransforms.push(Schema.Trim);
  }

  if (config.lowercase) {
    inputTransforms.push(Schema.Lowercase);
  } else if (config.uppercase) {
    inputTransforms.push(Schema.Uppercase);
  } else if (config.capitalize) {
    inputTransforms.push(Schema.Capitalize);
  }

  if (config.stripNonAlphabetic) {
    inputTransforms.push(
      Schema.transform(Schema.String, Schema.String, {
        strict: true,
        decode: (s) => s.replace(/[^a-zA-Z]/g, ""),
        encode: (s) => s,
      }),
    );
  }

  if (config.stripNonNumeric) {
    inputTransforms.push(
      Schema.transform(Schema.String, Schema.String, {
        strict: true,
        decode: (s) => s.replace(/[^0-9]/g, ""),
        encode: (s) => s,
      }),
    );
  }

  if (config.customTransforms) {
    inputTransforms.push(...config.customTransforms);
  }

  return {
    inputTransforms: inputTransforms.length > 0 ? inputTransforms : undefined,
  };
};

export class TextFieldService extends Effect.Service<TextFieldService>()(
  "@flowline/forms/TextFieldService",
  {
    effect: Effect.gen(function* () {
      const inputService = yield* InputService;

      return {
        make: (config: TextFieldConfig): Effect.Effect<TextField, FieldError> =>
          Effect.gen(function* () {
            const transforms = buildTextTransforms(config);

            const inputConfig: InputConfig<string> = {
              ...config,
              initialValue: config.initialValue ?? "",
              transform: transforms,
            };

            const inputField = yield* inputService.make(inputConfig);

            return {
              ...inputField,
              textConfig: config,
            };
          }),
      };
    }),
    dependencies: [InputService.Default],
  },
) {}

export const makeTextField = (config: TextFieldConfig) =>
  Effect.gen(function* () {
    const textFieldService = yield* TextFieldService;
    return yield* textFieldService.make(config);
  });

// Builder API for common text field patterns
export const textField = {
  text: (config?: Partial<TextFieldConfig>): TextFieldConfig => ({
    initialValue: "",
    ...config,
  }),

  trimmed: (
    config?: Partial<Omit<TextFieldConfig, "trim">>,
  ): TextFieldConfig => ({
    initialValue: "",
    trim: true,
    ...config,
  }),

  lowercase: (
    config?: Partial<Omit<TextFieldConfig, "lowercase">>,
  ): TextFieldConfig => ({
    initialValue: "",
    lowercase: true,
    ...config,
  }),

  uppercase: (
    config?: Partial<Omit<TextFieldConfig, "uppercase">>,
  ): TextFieldConfig => ({
    initialValue: "",
    uppercase: true,
    ...config,
  }),

  capitalize: (
    config?: Partial<Omit<TextFieldConfig, "capitalize">>,
  ): TextFieldConfig => ({
    initialValue: "",
    capitalize: true,
    ...config,
  }),

  alphaOnly: (
    config?: Partial<Omit<TextFieldConfig, "stripNonAlphabetic">>,
  ): TextFieldConfig => ({
    initialValue: "",
    stripNonAlphabetic: true,
    ...config,
  }),

  numericOnly: (
    config?: Partial<Omit<TextFieldConfig, "stripNonNumeric">>,
  ): TextFieldConfig => ({
    initialValue: "",
    stripNonNumeric: true,
    ...config,
  }),

  withCustomTransform: (
    transforms: ReadonlyArray<Schema.Schema<string, string>>,
    config?: Partial<Omit<TextFieldConfig, "customTransforms">>,
  ): TextFieldConfig => ({
    initialValue: "",
    customTransforms: transforms,
    ...config,
  }),
};
