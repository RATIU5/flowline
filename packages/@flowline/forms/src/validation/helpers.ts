import { Schema } from "effect";

/**
 * Composable validation schemas using Effect's built-in filters and transformations
 */
export const validators = {
  /**
   * Validates that a string is not empty after trimming
   */
  required: (message = "This field is required") =>
    Schema.String.pipe(
      Schema.nonEmptyString()
    ).annotations({ 
      message: () => message,
      identifier: "RequiredField"
    }),

  /**
   * Validates email format using a simple regex
   */
  email: (message = "Please enter a valid email address") =>
    Schema.String.pipe(
      Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ).annotations({ 
      message: () => message,
      identifier: "EmailField"
    }),

  /**
   * Validates that a numeric string represents an age above minimum
   */
  minAge: (age: number, message = `Age must be at least ${age}`) =>
    Schema.String.pipe(
      Schema.filter((s) => {
        const parsed = parseInt(s, 10);
        return !Number.isNaN(parsed) && parsed >= age;
      })
    ).annotations({ 
      message: () => message,
      identifier: "AgeField"
    }),

  /**
   * Validates that a string matches a regex pattern
   */
  pattern: (regex: RegExp, message: string) =>
    Schema.String.pipe(
      Schema.pattern(regex)
    ).annotations({ 
      message: () => message,
      identifier: "PatternField"
    }),

  /**
   * Validates that a string has at least the minimum length
   */
  minLength: (length: number, message = `Must be at least ${length} characters`) =>
    Schema.String.pipe(
      Schema.minLength(length)
    ).annotations({ 
      message: () => message,
      identifier: "MinLengthField"
    }),

  /**
   * Validates that a string has at most the maximum length
   */
  maxLength: (length: number, message = `Must be at most ${length} characters`) =>
    Schema.String.pipe(
      Schema.maxLength(length)
    ).annotations({ 
      message: () => message,
      identifier: "MaxLengthField"
    }),

  /**
   * Validates that a string contains only alphabetic characters
   */
  alphabeticOnly: (message = "Only letters are allowed") =>
    Schema.String.pipe(
      Schema.pattern(/^[a-zA-Z]+$/)
    ).annotations({ 
      message: () => message,
      identifier: "AlphabeticField"
    }),

  /**
   * Validates that a string contains only numeric characters
   */
  numericOnly: (message = "Only numbers are allowed") =>
    Schema.String.pipe(
      Schema.pattern(/^[0-9]+$/)
    ).annotations({ 
      message: () => message,
      identifier: "NumericField"
    }),

  /**
   * Validates that a string contains only alphanumeric characters
   */
  alphanumericOnly: (message = "Only letters and numbers are allowed") =>
    Schema.String.pipe(
      Schema.pattern(/^[a-zA-Z0-9]+$/)
    ).annotations({ 
      message: () => message,
      identifier: "AlphanumericField"
    }),

  /**
   * Custom validator with user-defined validation function
   */
  custom: (validate: (s: string) => boolean, message: string) =>
    Schema.String.pipe(
      Schema.filter(validate)
    ).annotations({ 
      message: () => message,
      identifier: "CustomField"
    }),

  /**
   * Validates URL format
   */
  url: (message = "Please enter a valid URL") =>
    Schema.String.pipe(
      Schema.filter((s) => {
        try {
          new URL(s);
          return true;
        } catch {
          return false;
        }
      })
    ).annotations({ 
      message: () => message,
      identifier: "URLField"
    }),

  /**
   * Validates phone number format (simple US format)
   */
  phoneNumber: (message = "Please enter a valid phone number") =>
    Schema.String.pipe(
      Schema.pattern(/^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/)
    ).annotations({ 
      message: () => message,
      identifier: "PhoneField"
    }),
};

/**
 * Advanced validation composition utilities
 */
export const compose = {
  /**
   * Combines multiple string validators with AND logic
   * All validators must pass for the value to be valid
   * Returns a proper Schema that can be used in form validations
   */
  all: (...schemas: Array<Schema.Schema.AnyNoContext>) => {
    if (schemas.length === 0) return Schema.String;
    if (schemas.length === 1) return schemas[0];
    
    // Use the simplest approach - pipe the schemas together
    return schemas.reduce((acc, schema) => {
      return acc.pipe(Schema.compose(schema));
    });
  },

  /**
   * Creates a conditional validator based on a predicate
   */
  when: (
    condition: (value: string) => boolean,
    thenSchema: Schema.Schema.AnyNoContext,
    elseSchema?: Schema.Schema.AnyNoContext
  ) => Schema.String.pipe(
    Schema.filter((value: string) => {
      if (condition(value)) {
        return Schema.is(thenSchema)(value);
      }
      return elseSchema ? Schema.is(elseSchema)(value) : true;
    })
  ).annotations({ identifier: "ConditionalField" }),

  /**
   * Combines validators with OR logic - at least one must pass
   */
  any: (...schemas: Array<Schema.Schema.AnyNoContext>) =>
    Schema.Union(...schemas).annotations({ identifier: "UnionField" }),

  /**
   * Creates a schema that validates different rules based on field length
   */
  lengthBased: (rules: Array<{
    minLength: number;
    maxLength?: number;
    schema: Schema.Schema.AnyNoContext;
  }>) => Schema.String.pipe(
    Schema.filter((s: string) => {
      const matchingRule = rules.find(rule => 
        s.length >= rule.minLength && 
        (rule.maxLength === undefined || s.length <= rule.maxLength)
      );
      return matchingRule ? Schema.is(matchingRule.schema)(s) : false;
    })
  ).annotations({ 
    identifier: "LengthBasedField",
    message: () => "No matching validation rule for this length"
  }),

  /**
   * Creates a pipeline of transformations and validations  
   */
  pipeline: (...schemas: Array<Schema.Schema.AnyNoContext>) => 
    schemas.reduce((acc, schema) => {
      if (acc === undefined) return schema;
      return acc.pipe(Schema.compose(schema));
    }),
};
