import { Effect, Stream } from "effect";
import type { Form } from "@flowline/forms";
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
  private isDestroyed = false;
  private domUtils: DOMUtils;

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
    this.domUtils = new DOMUtils(element);
  }

  static create<T extends Record<string, unknown>>(
    element: HTMLFormElement,
    form: Form<T>,
    config?: Partial<VanillaAdapterConfig>,
  ): Effect.Effect<VanillaFormAdapter<T>, AdapterError> {
    return Effect.gen(function* () {
      const adapter = new VanillaFormAdapter(element, form, config);
      yield* adapter.bind();
      return adapter;
    });
  }

  bind(): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      if (this.isDestroyed) {
        return yield* Effect.fail(
          new AdapterError({
            message: "Cannot bind destroyed adapter",
            operation: "bind",
          }),
        );
      }

      yield* Effect.scoped(
        Effect.gen(this, function* () {
          const handleSubmits = Stream.runForEach(
            Stream.fromEventListener<SubmitEvent>(this.element, "submit"),
            (event: SubmitEvent) =>
              Effect.gen(this, function* () {
                if (this.config.preventDefault) {
                  event.preventDefault();
                }
                const submitEffect = this.config.onSubmit
                  ? this.form.submit(this.config.onSubmit)
                  : this.form.submit((values) =>
                      Effect.succeed({
                        success: true,
                        data: values,
                        timestamp: new Date().toISOString(),
                      }),
                    );
                yield* submitEffect;
              }),
          );
          yield* Effect.forkScoped(handleSubmits);

          if (this.config.validateOnInput) {
            const inputStream = Stream.fromEventListener<Event>(
              this.element,
              "input",
            ).pipe(
              Stream.map((event: Event) => event.target),
              Stream.filter(
                (target): target is HTMLInputElement =>
                  target instanceof HTMLInputElement && !!target.name,
              ),
            );

            const handleInputs = this.config.debounceMs
              ? inputStream.pipe(
                  Stream.debounce(`${this.config.debounceMs} millis`),
                  Stream.runForEach((target) =>
                    this.form.setValues({
                      [target.name]: DOMUtils.getInputValue(target),
                    } as Partial<T>),
                  ),
                )
              : inputStream.pipe(
                  Stream.runForEach((target) =>
                    this.form.setValues({
                      [target.name]: DOMUtils.getInputValue(target),
                    } as Partial<T>),
                  ),
                );

            yield* Effect.forkScoped(handleInputs);
          }

          if (this.config.validateOnBlur) {
            const handleBlurs = Stream.runForEach(
              Stream.fromEventListener<FocusEvent>(
                this.element,
                "focusout",
              ).pipe(
                Stream.map((event: FocusEvent) => event.target),
                Stream.filter(
                  (target): target is HTMLInputElement =>
                    target instanceof HTMLInputElement && !!target.name,
                ),
              ),
              (target: HTMLInputElement) => this.form.touch(target.name),
            );
            yield* Effect.forkScoped(handleBlurs);
          }

          const syncUiToState = this.form.stateStream.pipe(
            Stream.runForEach((state) =>
              Effect.gen(this, function* () {
                this.element.classList.toggle("form-dirty", state.isDirty);
                this.element.classList.toggle("form-valid", state.isValid);
                this.element.classList.toggle("form-invalid", !state.isValid);
                this.element.classList.toggle(
                  "form-submitting",
                  state.isSubmitting,
                );

                const fields = yield* this.domUtils.findFormFields();
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

                yield* this.updateValidationUI(state.errors);
              }),
            ),
          );
          yield* Effect.forkScoped(syncUiToState);

          if (this.config.autoDiscover) {
            yield* this.autoDiscoverFields();
          }

          yield* this.syncFormState();
        }),
      );
    });
  }

  unbind(): Effect.Effect<void, AdapterError> {
    return Effect.succeed(void 0);
  }

  destroy(): Effect.Effect<void, AdapterError> {
    return Effect.sync(() => {
      this.isDestroyed = true;
    });
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
      const fields = yield* this.domUtils.findFormFields();

      for (const [fieldName, value] of Object.entries(formState.values)) {
        const element = fields[fieldName];
        if (element) {
          yield* DOMUtils.setInputValue(element, String(value ?? ""));
        }
      }

      yield* this.updateValidationUI(formState.errors);
    });
  }

  private autoDiscoverFields(): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      const fields = yield* this.domUtils.findFormFields();

      const initialValues = Object.fromEntries(
        Object.entries(fields).map(([name, element]) => [
          name,
          DOMUtils.getInputValue(element),
        ]),
      );

      if (Object.keys(initialValues).length > 0) {
        yield* this.form
          .setValues(initialValues as Partial<T>)
          .pipe(Effect.catchAll(() => Effect.succeed(undefined)));
      }
    });
  }

  private updateValidationUI(
    errors: Record<string, any>,
  ): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      const fields = yield* this.domUtils.findFormFields();

      for (const [fieldName, element] of Object.entries(fields)) {
        const fieldErrors = errors[fieldName] || [];
        const hasErrors = fieldErrors.length > 0;

        element.classList.toggle("field-valid", !hasErrors);
        element.classList.toggle("field-invalid", hasErrors);

        yield* this.updateFieldErrorDisplay(element, fieldErrors);
      }
    });
  }

  private updateFieldErrorDisplay(
    element: HTMLElement,
    errors: any[],
  ): Effect.Effect<void, AdapterError> {
    return Effect.sync(() => {
      const errorId = `${element.getAttribute("name")}-error`;
      let errorElement = document.getElementById(errorId);

      if (errors.length > 0) {
        if (!errorElement) {
          errorElement = document.createElement("div");
          errorElement.id = errorId;
          errorElement.className = "field-error";
          element.parentNode?.insertBefore(errorElement, element.nextSibling);
        }
        errorElement.textContent = errors[0].message || errors[0];
        errorElement.style.display = "block";
      } else if (errorElement) {
        errorElement.style.display = "none";
      }
    });
  }
}
