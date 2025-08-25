import { Effect, Stream } from "effect";
import type { Form, FieldValidationError } from "@flowline/forms";
import type { FormAdapter, VanillaAdapterConfig } from "../core/types.js";
import { AdapterError } from "../core/types.js";
import { DOMUtils } from "../core/dom-utils.js";

/**
 * Vanilla TypeScript/JavaScript form adapter
 * Uses Effect patterns following Effect best practices
 */
export class VanillaFormAdapter<T extends Record<string, unknown>>
  implements FormAdapter<T>
{
  private domUtils: DOMUtils;
  private fieldCache: Record<string, HTMLElement> | null = null;

  readonly config: VanillaAdapterConfig;

  constructor(
    readonly element: HTMLFormElement,
    readonly form: Form<T>,
    userConfig: Partial<VanillaAdapterConfig> = {},
  ) {
    this.config = {
      autoDiscover: true,
      validateOnInput: true,
      validateOnBlur: true,
      debounceMs: 300,
      preventDefault: true,
      ...userConfig,
    };
    console.log("VanillaFormAdapter created with config:", this.config);
    this.domUtils = new DOMUtils(element);
  }

  bind(): Effect.Effect<void, AdapterError> {
    console.log("VanillaFormAdapter bind() called");
    return Effect.gen(this, function* (this: VanillaFormAdapter<T>) {
      console.log("VanillaFormAdapter bind() starting Effect");
      yield* Effect.scoped(
        Effect.gen(this, function* (this: VanillaFormAdapter<T>) {
          // Cache fields once at bind time
          this.fieldCache = yield* this.domUtils.findFormFields();

          const handleSubmits = Stream.runForEach(
            Stream.fromEventListener<SubmitEvent>(this.element, "submit"),
            (event: SubmitEvent) =>
              Effect.gen(this, function* () {
                if (this.config.preventDefault) {
                  event.preventDefault();
                }
                if (!this.config.onSubmit) {
                  console.warn(
                    "Form submitted with no onSubmit handler. Consider providing one for proper form handling.",
                  );
                  return;
                }
                yield* this.form.submit(this.config.onSubmit);
              }),
          );
          yield* Effect.forkScoped(handleSubmits);

          if (this.config.validateOnInput) {
            console.log("Setting up input validation with Effect-wrapped native events");
            
            // Use Effect-wrapped native event listeners 
            const handleInput = (event: Event) => {
              const target = event.target as HTMLInputElement;
              if (target instanceof HTMLInputElement && target.name) {
                console.log("Effect input event:", target.name, "=", DOMUtils.getTypedInputValue(target));
                // Run the effect within the event handler
                Effect.runFork(
                  this.form.setValues({
                    [target.name]: DOMUtils.getTypedInputValue(target),
                  } as Partial<T>)
                );
              }
            };

            // Add native event listener (Effect-managed)
            this.element.addEventListener('input', handleInput);
            console.log("Effect-managed input event listener attached");
            
            // Ensure cleanup happens when scope ends
            yield* Effect.addFinalizer(() => 
              Effect.sync(() => {
                console.log("Cleaning up input event listener");
                this.element.removeEventListener('input', handleInput);
              })
            );
          }

          if (this.config.validateOnBlur) {
            console.log("Setting up blur validation with Effect-wrapped native events");
            
            // Use Effect-wrapped native event listeners
            const handleBlur = (event: Event) => {
              const target = event.target as HTMLInputElement;
              if (target instanceof HTMLInputElement && target.name) {
                console.log("Effect blur event:", target.name);
                // Run the effect within the event handler
                Effect.runFork(this.form.touch(target.name));
              }
            };

            // Add native event listener (Effect-managed)
            this.element.addEventListener('focusout', handleBlur);
            console.log("Effect-managed blur event listener attached");
            
            // Ensure cleanup happens when scope ends
            yield* Effect.addFinalizer(() => 
              Effect.sync(() => {
                console.log("Cleaning up blur event listener");
                this.element.removeEventListener('focusout', handleBlur);
              })
            );
          }

          const syncUiToState = Stream.runForEach(
            this.form.stateStream,
            (state) =>
              Effect.gen(this, function* () {
                console.log("Adapter state sync - isValid:", state.isValid, "errors:", Object.keys(state.errors));
                
                this.element.classList.toggle("form-dirty", state.isDirty);
                this.element.classList.toggle("form-valid", state.isValid);
                this.element.classList.toggle("form-invalid", !state.isValid);
                this.element.classList.toggle(
                  "form-submitting",
                  state.isSubmitting,
                );

                // Use cached fields instead of re-querying
                const fields = this.fieldCache || {};
                for (const [fieldName, value] of Object.entries(state.values)) {
                  const element = fields[fieldName];
                  if (element) {
                    const currentValue = DOMUtils.getInputValue(element);
                    const stateValue = String(value ?? "");
                    if (currentValue !== stateValue) {
                      yield* DOMUtils.setInputValue(element, stateValue);
                    }
                  }
                }

                console.log("About to update validation UI with errors:", Object.keys(state.errors));
                yield* this.updateValidationUI(state.errors);
                console.log("Validation UI update completed");
              }).pipe(
                Effect.catchAll((error) => {
                  console.error("Vanilla adapter UI sync error:", error);
                  return Effect.void;
                })
              ),
          );
          yield* Effect.forkScoped(syncUiToState);

          if (this.config.autoDiscover) {
            yield* this.autoDiscoverFieldsWithoutValidation();
          }

          yield* this.syncFormStateWithoutValidation();
        }),
      );
    });
  }

  unbind(): Effect.Effect<void, AdapterError> {
    return Effect.succeed(void 0);
  }

  getFieldElement(
    name: keyof T,
  ): Effect.Effect<HTMLElement | null, AdapterError> {
    return this.domUtils.findByName(String(name));
  }

  syncFormState(): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      const formState = yield* this.form.getState().pipe(
        Effect.catchAll(() =>
          Effect.fail(
            new AdapterError({
              message: "Failed to get form state",
              operation: "syncFormState",
            }),
          ),
        ),
      );
      // Use cached fields if available, otherwise query them
      const fields = this.fieldCache || (yield* this.domUtils.findFormFields());

      for (const [fieldName, value] of Object.entries(formState.values)) {
        const element = fields[fieldName];
        if (element) {
          yield* DOMUtils.setInputValue(element, String(value ?? ""));
        }
      }

      yield* this.updateValidationUI(formState.errors);
    });
  }

  private syncFormStateWithoutValidation(): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      const formState = yield* this.form.getState().pipe(
        Effect.catchAll(() =>
          Effect.fail(
            new AdapterError({
              message: "Failed to get form state",
              operation: "syncFormStateWithoutValidation",
            }),
          ),
        ),
      );
      // Use cached fields if available, otherwise query them
      const fields = this.fieldCache || (yield* this.domUtils.findFormFields());

      for (const [fieldName, value] of Object.entries(formState.values)) {
        const element = fields[fieldName];
        if (element) {
          yield* DOMUtils.setInputValue(element, String(value ?? ""));
        }
      }

      // Don't update validation UI on initial sync to avoid showing errors immediately
      // yield* this.updateValidationUI(formState.errors);
    });
  }

  private autoDiscoverFieldsWithoutValidation(): Effect.Effect<
    void,
    AdapterError
  > {
    return Effect.gen(this, function* () {
      const fields = yield* this.domUtils.findFormFields();

      const initialValues = Object.fromEntries(
        Object.entries(fields).map(([name, element]) => [
          name,
          DOMUtils.getTypedInputValue(element),
        ]),
      );

      if (Object.keys(initialValues).length > 0) {
        // Use a direct state update instead of setValues to avoid triggering validation
        if (this.form.setValuesWithoutValidation) {
          yield* this.form
            .setValuesWithoutValidation(initialValues as Partial<T>)
            .pipe(Effect.catchAll(() => Effect.succeed(undefined)));
        } else {
          yield* this.form
            .setValues(initialValues as Partial<T>)
            .pipe(Effect.catchAll(() => Effect.succeed(undefined)));
        }
      }
    });
  }

  private updateValidationUI(
    errors: Record<string, readonly FieldValidationError[]>,
  ): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      const fields = this.fieldCache || {};

      for (const [fieldName, element] of Object.entries(fields)) {
        const fieldErrors = errors[fieldName] || [];
        const hasErrors = fieldErrors.length > 0;

        element.classList.toggle("field-valid", !hasErrors);
        element.classList.toggle("field-invalid", hasErrors);

        yield* this.updateFieldErrorDisplay(fieldName, element, fieldErrors);
      }
    });
  }

  private updateFieldErrorDisplay(
    fieldName: string,
    element: HTMLElement,
    errors: readonly FieldValidationError[],
  ): Effect.Effect<void, AdapterError> {
    return Effect.sync(() => {
      // Clear any existing error display
      const existingErrorId = `${fieldName}-error`;
      const existingError = document.getElementById(existingErrorId);
      if (existingError) {
        existingError.remove();
      }

      if (errors.length === 0) {
        return;
      }

      // Use custom error renderer if provided
      if (this.config.errorRenderer) {
        const errorElement = this.config.errorRenderer(
          fieldName,
          errors as FieldValidationError[],
        );
        if (errorElement) {
          element.parentNode?.insertBefore(errorElement, element.nextSibling);
        }
        return;
      }

      // Use custom error selector if provided
      if (this.config.errorSelector) {
        const selector = this.config.errorSelector(fieldName);
        const errorContainer = document.querySelector(selector);
        if (errorContainer) {
          errorContainer.textContent = errors[0]?.message || String(errors[0]);
          return;
        }
      }

      // Default error display behavior (fallback)
      const errorElement = document.createElement("div");
      errorElement.id = existingErrorId;
      errorElement.className = "field-error";
      
      // Use the clean error message directly from ArrayFormatter
      const firstError = errors[0];
      const errorMessage = firstError?.message || "Validation failed";
      
      errorElement.textContent = errorMessage;
      element.parentNode?.insertBefore(errorElement, element.nextSibling);
    });
  }
}
