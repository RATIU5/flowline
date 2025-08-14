import { Schema } from "effect";

/**
 * Composable validation schemas using Effect's built-in filters and transformations
 */
export const validators = {
  /**
   * Validates that a string is not empty after trimming
   */
  required: (message = "This field is required") =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.nonEmptyString({ message: () => message })
      )
    ),

  /**
   * Validates email format using a simple regex
   */
  email: (message = "Please enter a valid email address") =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: () => message })
      )
    ),

  /**
   * Validates that a numeric string represents an age above minimum
   */
  minAge: (age: number, message = `Age must be at least ${age}`) =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.filter((s) => {
          const parsed = parseInt(s, 10);
          return !Number.isNaN(parsed) && parsed >= age || message;
        })
      )
    ),

  /**
   * Validates that a string matches a regex pattern
   */
  pattern: (regex: RegExp, message: string) =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(Schema.pattern(regex, { message: () => message }))
    ),

  /**
   * Validates that a string has at least the minimum length
   */
  minLength: (length: number, message = `Must be at least ${length} characters`) =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(Schema.minLength(length, { message: () => message }))
    ),

  /**
   * Validates that a string has at most the maximum length
   */
  maxLength: (length: number, message = `Must be at most ${length} characters`) =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(Schema.maxLength(length, { message: () => message }))
    ),

  /**
   * Validates that a string contains only alphabetic characters
   */
  alphabeticOnly: (message = "Only letters are allowed") =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.pattern(/^[a-zA-Z]+$/, { message: () => message })
      )
    ),

  /**
   * Validates that a string contains only numeric characters
   */
  numericOnly: (message = "Only numbers are allowed") =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.pattern(/^[0-9]+$/, { message: () => message })
      )
    ),

  /**
   * Validates that a string contains only alphanumeric characters
   */
  alphanumericOnly: (message = "Only letters and numbers are allowed") =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.pattern(/^[a-zA-Z0-9]+$/, { message: () => message })
      )
    ),

  /**
   * Custom validator with user-defined validation function
   */
  custom: (validate: (s: string) => boolean, message: string) =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.filter((s) => validate(s) || message)
      )
    ),

  /**
   * Validates URL format
   */
  url: (message = "Please enter a valid URL") =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.filter((s) => {
          try {
            new URL(s);
            return true;
          } catch {
            return message;
          }
        })
      )
    ),

  /**
   * Validates phone number format (simple US format)
   */
  phoneNumber: (message = "Please enter a valid phone number") =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.pattern(/^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/, { message: () => message })
      )
    ),
};

/**
 * Advanced validation composition utilities
 */
export const compose = {
  /**
   * Combines multiple string validators with AND logic
   * All validators must pass for the value to be valid
   */
  all: (...schemas: Array<Schema.Schema<string, unknown>>) =>
    schemas.reduce((acc, schema) => Schema.compose(acc, schema)),

  /**
   * Creates a conditional validator based on a predicate
   */
  when: (
    condition: (value: string) => boolean,
    thenSchema: Schema.Schema<string, unknown>,
    elseSchema?: Schema.Schema<string, unknown>
  ) =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.filter((value: string) => {
          if (condition(value)) {
            return Schema.is(thenSchema)(value);
          }
          return elseSchema ? Schema.is(elseSchema)(value) : true;
        })
      )
    ),

  /**
   * Combines validators with OR logic - at least one must pass
   */
  any: (...schemas: Array<Schema.Schema<string, unknown>>) =>
    Schema.Union(...schemas),

  /**
   * Creates a schema that validates different rules based on field length
   */
  lengthBased: (rules: Array<{
    minLength: number;
    maxLength?: number;
    schema: Schema.Schema<string, unknown>;
  }>) =>
    Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.filter((s: string) => {
          const matchingRule = rules.find(rule => 
            s.length >= rule.minLength && 
            (rule.maxLength === undefined || s.length <= rule.maxLength)
          );
          return matchingRule ? Schema.is(matchingRule.schema)(s) : "No matching validation rule";
        })
      )
    ),

  /**
   * Creates a pipeline of transformations and validations  
   */
  pipeline: (...schemas: Array<Schema.Schema<string, unknown>>) => 
    schemas.reduce((acc, schema) => Schema.compose(acc, schema)),
};
