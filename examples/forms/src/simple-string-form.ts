import { Effect, Layer, pipe, Console, type Record, Schema } from "effect";
import {
  createTextField,
  textField,
  createForm,
  type FieldError,
  InputService,
  FormService,
  type FormConfig,
  validators,
  compose,
} from "@flowline/forms";

interface UserForm extends Record.ReadonlyRecord<string, unknown> {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly age: string;
  readonly password: string;
}

const EmailSchema = compose.all(validators.required(), validators.email());

const RequiredStringSchema = compose.all(
  validators.required(),
  validators.minLength(2),
);

const AgeSchema = compose.all(
  validators.required("Age is required"),
  validators.minAge(18, "Must be 18 or older"),
);

const PasswordSchema = compose.lengthBased([
  {
    minLength: 0,
    maxLength: 7,
    schema: Schema.compose(
      Schema.Unknown,
      Schema.String.pipe(
        Schema.filter(() => "Password must be at least 8 characters"),
      ),
    ),
  },
  {
    minLength: 8,
    maxLength: 11,
    schema: validators.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
      "Password must contain uppercase, lowercase, and number",
    ),
  },
  {
    minLength: 12,
    schema: validators.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
      "Strong password",
    ),
  },
]);

const createUserForm = (): Effect.Effect<
  void,
  FieldError,
  InputService | FormService
> =>
  Effect.gen(function* () {
    const firstNameField = yield* createTextField(
      textField.trimmed("firstName", {
        placeholder: "Enter first name",
        schema: RequiredStringSchema,
      }),
    );

    const lastNameField = yield* createTextField(
      textField.trimmed("lastName", {
        placeholder: "Enter last name",
        schema: RequiredStringSchema,
      }),
    );

    const emailField = yield* createTextField(
      textField.lowercase("email", {
        placeholder: "Enter email address",
        schema: EmailSchema,
      }),
    );

    const ageField = yield* createTextField(
      textField.numericOnly("age", {
        placeholder: "Enter age",
        schema: AgeSchema,
      }),
    );

    const passwordField = yield* createTextField(
      textField.text("password", {
        placeholder: "Enter password",
        schema: PasswordSchema,
      }),
    );

    const formConfig: FormConfig<UserForm> = {
      name: "userForm",
      validateOnChange: true,
      validateOnSubmit: true,
    };

    const initialValues: UserForm = {
      firstName: "",
      lastName: "",
      email: "",
      age: "",
      password: "",
    };

    const form = yield* createForm(formConfig, initialValues);

    yield* Console.log("=== Enhanced Form Validation Demo ===");
    yield* Console.log(
      "Using Effect's composable schema patterns with advanced validation!",
    );
    yield* Console.log("");

    yield* Console.log("1. Setting field values...");
    yield* firstNameField.setRawValue("John");
    yield* lastNameField.setRawValue("  Doe  ");
    yield* emailField.setRawValue("john.doe@example.com");
    yield* ageField.setRawValue("25abc");
    yield* passwordField.setRawValue("weakpass");

    yield* Console.log("");
    yield* Console.log("2. Field values after transformation:");

    const firstNameState = yield* firstNameField.getState();
    yield* Console.log(`   First Name: "${firstNameState.value}"`);

    const lastNameState = yield* lastNameField.getState();
    yield* Console.log(`   Last Name: "${lastNameState.value}" (trimmed)`);

    const emailState = yield* emailField.getState();
    yield* Console.log(`   Email: "${emailState.value}" (lowercase)`);

    const ageState = yield* ageField.getState();
    yield* Console.log(`   Age: "${ageState.value}" (numeric only)`);

    const passwordState = yield* passwordField.getState();
    yield* Console.log(
      `   Password: "${passwordState.value}" (length-based validation)`,
    );

    yield* Console.log("");
    yield* Console.log("3. Setting form values and validating...");

    yield* form.setValues({
      firstName: firstNameState.value,
      lastName: lastNameState.value,
      email: emailState.value,
      age: ageState.value,
      password: passwordState.value,
    });

    const formState = yield* form.getState();
    yield* Console.log(`   Form is valid: ${formState.isValid}`);
    yield* Console.log(`   Form is dirty: ${formState.isDirty}`);

    yield* Console.log("");
    yield* Console.log("4. Checking individual field validation...");

    // Manually trigger validation for each field
    yield* Effect.either(firstNameField.validate());
    yield* Effect.either(emailField.validate());
    yield* Effect.either(ageField.validate());
    yield* Effect.either(passwordField.validate());

    const firstNameErrors = yield* firstNameField.getErrors();
    const emailErrors = yield* emailField.getErrors();
    const ageErrors = yield* ageField.getErrors();
    const passwordErrors = yield* passwordField.getErrors();

    yield* Console.log(
      `   First Name errors: ${firstNameErrors.length > 0 ? firstNameErrors.join(", ") : "None"}`,
    );
    yield* Console.log(
      `   Email errors: ${emailErrors.length > 0 ? emailErrors.join(", ") : "None"}`,
    );
    yield* Console.log(
      `   Age errors: ${ageErrors.length > 0 ? ageErrors.join(", ") : "None"}`,
    );
    yield* Console.log(
      `   Password errors: ${passwordErrors.length > 0 ? passwordErrors.join(", ") : "None"}`,
    );

    yield* Console.log("");
    yield* Console.log("5. Testing form submission...");

    const submissionResult = yield* form.submit((values: UserForm) =>
      Effect.gen(function* () {
        yield* Console.log("   Processing form submission...");
        yield* Console.log(
          `   Welcome ${values.firstName} ${values.lastName}!`,
        );
        yield* Console.log(`   Email: ${values.email}`);
        yield* Console.log(`   Age: ${values.age}`);
        yield* Console.log(`   Password strength validated!`);
        return { success: true, userId: "user_123" };
      }),
    );

    if (submissionResult.success) {
      yield* Console.log("   ✓ Form submitted successfully!");
      yield* Console.log(`   User ID: ${submissionResult.data?.userId}`);
    } else {
      yield* Console.log("   ✗ Form submission failed");
    }

    yield* Console.log("");
    yield* Console.log("6. Testing progressive password validation...");

    yield* passwordField.setRawValue("weak");
    yield* Effect.either(passwordField.validate());
    const weakPasswordErrors = yield* passwordField.getErrors();
    yield* Console.log(
      `   Weak password ("weak"): ${weakPasswordErrors.join(", ")}`,
    );

    yield* passwordField.setRawValue("password123");
    yield* Effect.either(passwordField.validate());
    const mediumPasswordErrors = yield* passwordField.getErrors();
    yield* Console.log(
      `   Medium password ("password123"): ${mediumPasswordErrors.join(", ")}`,
    );

    yield* passwordField.setRawValue("StrongPass123!");
    yield* Effect.either(passwordField.validate());
    const strongPasswordErrors = yield* passwordField.getErrors();
    yield* Console.log(
      `   Strong password ("StrongPass123!"): ${strongPasswordErrors.length > 0 ? strongPasswordErrors.join(", ") : "✓ Valid"}`,
    );

    yield* Console.log("");
    yield* Console.log("7. Testing other validation with invalid data...");
    yield* emailField.setRawValue("invalid-email");
    yield* ageField.setRawValue("16");

    yield* Effect.either(emailField.validate());
    yield* Effect.either(ageField.validate());

    const emailValidationErrors = yield* emailField.getErrors();
    const ageValidationErrors = yield* ageField.getErrors();

    yield* Console.log(
      `   Invalid email errors: ${emailValidationErrors.join(", ")}`,
    );
    yield* Console.log(
      `   Invalid age errors: ${ageValidationErrors.join(", ")}`,
    );

    yield* Console.log("");
    yield* Console.log("8. Testing field clearing...");
    yield* emailField.clear();
    const clearedEmailState = yield* emailField.getState();
    yield* Console.log(`   Email after clear: "${clearedEmailState.value}"`);

    yield* Console.log("");
    yield* Console.log("=== Demo Complete ===");
    yield* Console.log("✨ Enhanced validation architecture demonstrates:");
    yield* Console.log("   • Composable schema patterns with compose.all()");
    yield* Console.log("   • Built-in Effect filters and transformations");
    yield* Console.log(
      "   • Progressive validation with compose.lengthBased()",
    );
    yield* Console.log(
      "   • Password strength validation based on input length",
    );
    yield* Console.log("   • Better error handling and context");
  });

export const runExample = (): Effect.Effect<void, never, never> =>
  pipe(
    createUserForm(),
    Effect.provide(Layer.mergeAll(InputService.Default, FormService.Default)),
    Effect.catchAll((error: FieldError) =>
      Console.log(`Error: ${error.message}`),
    ),
    Effect.asVoid,
  );
