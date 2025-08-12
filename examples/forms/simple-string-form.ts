import { Effect, Context, Layer, pipe, Console, Schema } from "effect";
import {
  makeTextField,
  textField,
  type TextField,
  type FieldError,
  TextFieldService,
} from "@flowline/forms";

/**
 * Define form data as a properly typed record
 */
interface FormData extends Record<string, string> {}

/**
 * A fictitious FormService that would coordinate form state and field interactions.
 * This represents the Form Effect that would be implemented later - showing how
 * developers would use it in a real application.
 *
 * This service would handle form-level operations like:
 * - Coordinating multiple fields
 * - Form-level validation
 * - Submission handling
 * - State synchronization
 */
class FormService extends Context.Tag("@flowline/forms/FormService")<
  FormService,
  {
    readonly create: <T extends Record<string, TextField>>(config: {
      readonly fields: T;
      readonly onSubmit?: (data: FormData) => Effect.Effect<void, never, never>;
    }) => Effect.Effect<
      {
        readonly fields: T;
        readonly submit: Effect.Effect<void, FieldError, never>;
        readonly reset: Effect.Effect<void, FieldError, never>;
        readonly getValues: Effect.Effect<FormData, FieldError, never>;
        readonly isValid: Effect.Effect<boolean, FieldError, never>;
      },
      never,
      never
    >;
  }
>() {}

/**
 * A mock implementation of the FormService for demonstration purposes.
 * In the real implementation, this would be a complete service with proper
 * field coordination, validation aggregation, and state management.
 */
const FormServiceLive = Layer.succeed(
  FormService,
  FormService.of({
    create: (config) => {
      const gatherFieldValues: Effect.Effect<FormData, FieldError, never> =
        Effect.gen(function* () {
          const values: FormData = {};
          for (const [fieldName, field] of Object.entries(config.fields)) {
            const fieldValue = yield* field.getValue;
            values[fieldName] = fieldValue;
          }
          return values;
        });

      const checkAllFieldsValid: Effect.Effect<boolean, FieldError, never> =
        Effect.gen(function* () {
          for (const field of Object.values(config.fields)) {
            const isFieldValid = yield* field.isValid;
            if (!isFieldValid) {
              return false;
            }
          }
          return true;
        });

      const resetAllFields: Effect.Effect<void, FieldError, never> = Effect.gen(
        function* () {
          for (const field of Object.values(config.fields)) {
            yield* field.reset;
          }
        },
      );

      const submit: Effect.Effect<void, FieldError, never> = Effect.gen(
        function* () {
          const values = yield* gatherFieldValues;
          if (config.onSubmit) {
            yield* config.onSubmit(values);
          }
          yield* Console.log("Form submitted with values:", values);
        },
      );

      const reset: Effect.Effect<void, FieldError, never> = Effect.gen(
        function* () {
          yield* resetAllFields;
          yield* Console.log("Form reset");
        },
      );

      return Effect.succeed({
        fields: config.fields,
        submit,
        reset,
        getValues: gatherFieldValues,
        isValid: checkAllFieldsValid,
      });
    },
  }),
);

/**
 * Example: Simple user profile form with a single string field
 *
 * This demonstrates how developers would use the @flowline/forms library:
 * 1. Define field configurations using the fluent API
 * 2. Create fields using Effect.gen and field factories
 * 3. Compose fields into a form using the FormService
 * 4. Handle form operations like submission and validation
 */
const createUserProfileForm = Effect.gen(function* () {
  const nameField = yield* makeTextField(
    textField.trimmed({
      required: true,
      stripNonAlphabetic: true,
      capitalize: true,
    }),
  );

  const formService = yield* FormService;
  const form = yield* formService.create({
    fields: {
      name: nameField,
    },
    onSubmit: (data: FormData) =>
      Effect.gen(function* () {
        yield* Console.log("Submitting user profile:", data);
      }),
  });

  return form;
});

/**
 * Example: Using the form in an application
 * This shows the typical flow a developer would follow
 */
const exampleUsage = Effect.gen(function* () {
  const form = yield* createUserProfileForm;

  const userInput = "  johnny ";

  yield* form.fields.name.setRawValue(userInput);

  const transformedValue = yield* form.fields.name.getValue;
  yield* Console.log("Transformed value:", transformedValue);

  const validatedValue = yield* Effect.either(form.fields.name.validate());
  if (validatedValue._tag === "Right") {
    yield* Console.log("Field validation successful:", validatedValue.right);
  } else {
    yield* Console.log("Field validation failed:", validatedValue.left);
  }

  const isFieldValid = yield* form.fields.name.isValid;
  yield* Console.log("Name field is valid:", isFieldValid);

  const allValues = yield* form.getValues;
  yield* Console.log("All form values:", allValues);

  const isFormValid = yield* form.isValid;
  yield* Console.log("Form is valid:", isFormValid);

  if (isFormValid) {
    yield* form.submit;
  }
});

/**
 * Complete example showing the full Effect-based application
 * with proper service provisioning and error handling
 */
const program = pipe(
  exampleUsage,
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      yield* Console.log("Form error occurred:", error);
    }),
  ),
  Effect.provide(FormServiceLive),
  Effect.provide(TextFieldService.Default),
);

// This would be how the developer runs their form application
export const runExample = () => Effect.runPromise(program);

// For Node.js environments, you could run this directly:
runExample().then(() => console.log("Form example completed"));

/**
 * Development Notes:
 *
 * This example showcases several key patterns for Effect-based forms:
 *
 * 1. **Service-Oriented Architecture**: FormService encapsulates form behavior
 * 2. **Composition over Inheritance**: Fields compose into forms naturally
 * 3. **Type Safety**: Full TypeScript inference throughout the form definition
 * 4. **Effect.gen**: Clean, async/await-like syntax for complex operations
 * 5. **Layer-based DI**: Services provided through Effect's Layer system
 * 6. **Error Handling**: Proper Effect-based error management
 *
 * Future Enhancements:
 * - Multi-field forms with cross-field validation
 * - Dynamic field arrays
 * - Conditional field rendering
 * - Auto-save functionality
 * - Form wizards/multi-step forms
 */
