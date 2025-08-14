import { Effect, Schema } from "effect";
import {
  type InputConfig,
  type InputField,
  type InputService,
  type InputTransformConfig,
  createInputField,
} from "../../services/mod.js";
import type { FieldError } from "../../core/mod.js";

export interface TextFieldConfig
  extends Omit<InputConfig<string>, "initialValue"> {
  readonly name: string;
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

export const createTextField = (
  config: TextFieldConfig,
): Effect.Effect<TextField, FieldError, InputService> =>
  Effect.gen(function* () {
    const transforms = buildTextTransforms(config);

    const inputConfig: InputConfig<string> = {
      ...config,
      initialValue: config.initialValue ?? "",
      transform: transforms,
    };

    const inputField = yield* createInputField(inputConfig);

    return {
      ...inputField,
      textConfig: config,
    };
  });

export const textField = {
  text: (
    name: string,
    config?: Partial<Omit<TextFieldConfig, "name">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    ...config,
  }),

  trimmed: (
    name: string,
    config?: Partial<Omit<TextFieldConfig, "name" | "trim">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    trim: true,
    ...config,
  }),

  lowercase: (
    name: string,
    config?: Partial<Omit<TextFieldConfig, "name" | "lowercase">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    lowercase: true,
    ...config,
  }),

  uppercase: (
    name: string,
    config?: Partial<Omit<TextFieldConfig, "name" | "uppercase">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    uppercase: true,
    ...config,
  }),

  capitalize: (
    name: string,
    config?: Partial<Omit<TextFieldConfig, "name" | "capitalize">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    capitalize: true,
    ...config,
  }),

  alphaOnly: (
    name: string,
    config?: Partial<Omit<TextFieldConfig, "name" | "stripNonAlphabetic">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    stripNonAlphabetic: true,
    ...config,
  }),

  numericOnly: (
    name: string,
    config?: Partial<Omit<TextFieldConfig, "name" | "stripNonNumeric">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    stripNonNumeric: true,
    ...config,
  }),

  withCustomTransform: (
    name: string,
    transforms: ReadonlyArray<Schema.Schema<string, string>>,
    config?: Partial<Omit<TextFieldConfig, "name" | "customTransforms">>,
  ): TextFieldConfig => ({
    name,
    initialValue: "",
    customTransforms: transforms,
    ...config,
  }),
};
