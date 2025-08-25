import { Effect, Stream } from "effect";
import { compose, validators } from "@flowline/forms";
import { bindForm } from "@flowline/forms-vanilla";
import { createFormConfig } from "./form-config.js";

// 1. Define the shape of our form data with proper types
// Note: Form values are initially strings and get converted by typed inputs
type UserForm = {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly age: string; // Will be converted to number by data-type="number"
  readonly country: string;
  readonly newsletter: boolean; // Will be converted by data-type="boolean"
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
      validators.numericOnly("Age must be a number"),
      validators.minAge(18, "Must be 18 or older"),
    ),
    country: validators.required("Please select a country"),
    // Newsletter is optional - no validation needed for checkboxes
    password: compose.all(
      validators.required(),
      validators.minLength(8, "Password must be at least 8 characters"),
    ),
  },
});

// 3. Basic form setup - using default adapter configuration
// Submit behavior will be handled manually via form.submit() if needed

// 4. Define initial values for the form with proper types
const initialValues: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  age: "", // String initially, converted by typed input
  country: "",
  newsletter: false,
  password: "",
};

// 5. Main application logic, runs when the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  const formElement = document.querySelector<HTMLFormElement>("#user-form");
  if (!formElement) {
    console.error("Form element #user-form not found!");
    return;
  }

  // Configure the adapter for validation only, handle submit manually
  const adapterConfig = {
    validateOnBlur: true,
    validateOnInput: true,
    preventDefault: false, // We'll handle this manually to ensure validation runs
    errorSelector: (fieldName: string) => `#${fieldName}-error`,
    debounceMs: 0, // Disable debouncing to test immediate updates
  };

  bindForm(formElement, formConfig, initialValues, adapterConfig)
    .then(({ form, adapter, cleanup }) => {
      console.log("Form bound successfully!");

      const stateDisplay = document.getElementById("form-state-display");

      if (stateDisplay) {
        Effect.runFork(
          form.stateStream.pipe(
            Stream.runForEach((state) =>
              Effect.sync(() => {
                console.log("State stream update:", {
                  isValid: state.isValid,
                  errorCount: Object.keys(state.errors).length,
                  changedFields: Object.keys(state.values).filter(key => 
                    state.values[key as keyof UserForm] !== initialValues[key as keyof UserForm]
                  )
                });
                
                // Update the JSON display for debugging
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
              }),
            ),
          ),
        );
      }

      // Handle form submission manually to ensure validation runs
      formElement.addEventListener("submit", async (event) => {
        event.preventDefault(); // Always prevent default

        try {
          // Get current values from DOM first, then validate
          const currentState = await Effect.runPromise(form.getState());

          // Re-read values from DOM to ensure they're current
          const formData = new FormData(formElement);
          const domValues: Partial<UserForm> = {};
          for (const [key, value] of formData.entries()) {
            if (key in currentState.values) {
              // biome-ignore lint/suspicious/noExplicitAny: Dynamic form field assignment
              (domValues as any)[key] = value;
            }
          }

          // Update form with current DOM values, which will trigger validation
          await Effect.runPromise(form.setValues(domValues));

          // Force sync the adapter's UI state to ensure errors are displayed
          await Effect.runPromise(adapter.syncFormState());

          // Get state after setting values
          const updatedState = await Effect.runPromise(form.getState());

          if (updatedState.isValid) {
            console.log("All good");
          } else {
            console.error("Validation errors found:", updatedState.errors);
          }
        } catch {
          await Effect.runPromise(adapter.syncFormState());
        }
      });

      // Store cleanup function for later use (e.g., when navigating away)
      // biome-ignore lint/suspicious/noExplicitAny: Global cleanup function
      (globalThis as any).formCleanup = cleanup;
    })
    .catch((error: unknown) => {
      console.error("Failed to bind form:", error);
    });
});
