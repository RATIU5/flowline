import { Effect, Schema, Stream } from "effect";
import { compose, validators, type FormConfig } from "@flowline/forms";
import { bindForm, type VanillaAdapterConfig } from "@flowline/forms-vanilla";
import { createFormConfig } from "./form-config.js";

// 1. Define the shape of our form data.
type UserForm = {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly age: string;
  readonly password: string;
};

// 2. Create the form configuration using the generic helper.
// This ensures the `validations` object is checked directly against the
// generic `FormConfig<UserForm>` type, solving the variance issue without `as any`.
const formConfig = createFormConfig<UserForm>({
  name: "userForm",
  validateOnChange: true,
  validateOnSubmit: true,
  validations: {
    firstName: compose.all(validators.required(), validators.minLength(2)),
    lastName: compose.all(validators.required(), validators.minLength(2)),
    email: compose.all(validators.required(), validators.email()),
    age: compose.all(
      validators.required("Age is required"),
      validators.minAge(18, "Must be 18 or older"),
    ),
    password: compose.all(
      validators.required(),
      validators.minLength(8, "Password must be at least 8 characters"),
    ),
  },
});

// 3. Define the vanilla adapter config, including the submit handler
const adapterConfig: Partial<VanillaAdapterConfig<UserForm>> = {
  onSubmit: (values) =>
    Effect.gen(function* () {
      console.log("Submitting form with values:", values);
      yield* Effect.sleep("1 seconds");
      alert(`Form submitted successfully!\n${JSON.stringify(values, null, 2)}`);
      return { submissionId: `sub_${Math.random()}` };
    }),
};

// 4. Define initial values for the form.
const initialValues: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  age: "",
  password: "",
};

// 5. Main application logic, runs when the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  const formElement = document.querySelector<HTMLFormElement>('#user-form');
  if (!formElement) {
    console.error("Form element #user-form not found!");
    return;
  }

  bindForm(formElement, formConfig, initialValues, adapterConfig).then(({ form }) => {
    console.log("Form bound successfully!");

    const stateDisplay = document.getElementById('form-state-display');
    if (stateDisplay) {
      Effect.runFork(
        form.stateStream.pipe(
          Stream.runForEach((state) =>
            Effect.sync(() => {
              stateDisplay.textContent = JSON.stringify(
                {
                  isDirty: state.isDirty,
                  isValid: state.isValid,
                  isSubmitting: state.isSubmitting,
                  values: state.values,
                  errors: state.errors,
                },
                null,
                2,
              );

              Object.keys(state.values).forEach((fieldName) => {
                const errorContainer = document.getElementById(`${fieldName}-error`);
                if (errorContainer) {
                  const errors = state.errors[fieldName];
                  if (errors && errors.length > 0) {
                    errorContainer.textContent = errors[0].message;
                  } else {
                    errorContainer.textContent = "";
                  }
                }
              });
            }),
          ),
        ),
      );
    }
  }).catch((error: unknown) => {
    console.error("Failed to bind form:", error);
  });
});