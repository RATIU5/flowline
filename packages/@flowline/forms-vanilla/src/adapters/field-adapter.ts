import { Effect, Stream, pipe } from "effect";
import type { InputField } from "@flowline/forms";
import type { FieldAdapter, VanillaAdapterConfig } from "../core/types.js";
import { AdapterError } from "../core/types.js";
import { DOMUtils } from "../core/dom-utils.js";

/**
 * Vanilla TypeScript/JavaScript field adapter
 * Uses Effect patterns following Effect best practices
 */
export class VanillaFieldAdapter<T> implements FieldAdapter<T> {
  readonly config: VanillaAdapterConfig;

  constructor(
    readonly element:
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement,
    readonly field: InputField<T>,
    userConfig: Partial<VanillaAdapterConfig> = {},
  ) {
    this.config = {
      autoDiscover: false,
      validateOnInput: true,
      validateOnBlur: true,
      debounceMs: 300,
      preventDefault: false,
      ...userConfig,
    };
  }

  /**
   * Bind field to DOM element with event handling using Effect streams and scoped resource management
   */
  bind(): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      // The entire bind operation is now a Scoped resource.
      // When the scope is closed, all forked fibers are interrupted,
      // and their finalizers (like removeEventListener) are run.
      return yield* Effect.scoped(
        Effect.gen(this, function* () {
          // --- Event Streams ---

          // Input events with debouncing
          if (this.config.validateOnInput) {
            const inputStream = Stream.fromEventListener(
              this.element,
              "input",
            ).pipe(
              Stream.map((event) => {
                const target = event.target;
                return target instanceof HTMLElement
                  ? DOMUtils.getInputValue(target)
                  : "";
              }),
            );

            const handleInputs = this.config.debounceMs
              ? inputStream.pipe(
                  Stream.debounce(`${this.config.debounceMs} millis`),
                  Stream.runForEach((rawValue) =>
                    this.field.setRawValue(rawValue),
                  ),
                )
              : inputStream.pipe(
                  Stream.runForEach((rawValue) =>
                    this.field.setRawValue(rawValue),
                  ),
                );

            yield* Effect.forkScoped(handleInputs);
          }

          // Blur events for validation
          if (this.config.validateOnBlur) {
            const handleBlurs = Stream.runForEach(
              Stream.fromEventListener(this.element, "blur"),
              () => this.field.blur(),
            );
            yield* Effect.forkScoped(handleBlurs);
          }

          // Focus events
          const handleFocuses = Stream.runForEach(
            Stream.fromEventListener(this.element, "focus"),
            () => this.field.focus(),
          );
          yield* Effect.forkScoped(handleFocuses);

          // --- State Subscription Stream ---
          // This restores UI reactivity - the UI will be kept in sync with field state
          const syncUiToState = this.field.stateStream.pipe(
            Stream.runForEach((state) =>
              Effect.sync(() => {
                // Update input value if it changed
                const currentValue = DOMUtils.getInputValue(this.element);
                const stateValue = String(state.value ?? "");
                if (currentValue !== stateValue) {
                  this.element.value = stateValue;
                }

                // Update field display attributes
                this.element.setAttribute("data-dirty", String(state.isDirty));
                this.element.setAttribute(
                  "data-touched",
                  String(state.isTouched),
                );
                this.element.setAttribute(
                  "data-state",
                  state.isValid ? "valid" : "invalid",
                );
              }),
            ),
          );
          yield* Effect.forkScoped(syncUiToState);

          // Initial sync of field state to DOM
          yield* this.syncFieldState();
        }),
      );
    });
  }

  /**
   * Unbind the adapter (no-op since cleanup is handled by scoped effects)
   */
  unbind(): Effect.Effect<void, AdapterError> {
    return Effect.succeed(void 0);
  }

  /**
   * Get current value from DOM element - delegates to core field
   */
  getValue(): Effect.Effect<T, AdapterError> {
    return Effect.gen(this, function* () {
      const state = yield* this.field.getState().pipe(
        Effect.catchAll(() =>
          Effect.fail(
            new AdapterError({
              message: "Failed to get field state",
              operation: "getValue",
            }),
          ),
        ),
      );
      return state.value;
    });
  }

  /**
   * Set value to DOM element and update core field
   */
  setValue(value: T): Effect.Effect<void, AdapterError> {
    return pipe(
      DOMUtils.setInputValue(this.element, String(value ?? "")),
      Effect.flatMap(() =>
        this.field.setValue(value).pipe(
          Effect.catchAll(() =>
            Effect.fail(
              new AdapterError({
                message: "Failed to set field value",
                operation: "setValue",
              }),
            ),
          ),
        ),
      ),
    );
  }

  /**
   * Sync current field state to DOM element (initial sync only)
   */
  private syncFieldState(): Effect.Effect<void, AdapterError> {
    return Effect.gen(this, function* () {
      const state = yield* this.field.getState().pipe(
        Effect.catchAll(() =>
          Effect.fail(
            new AdapterError({
              message: "Failed to get field state",
              operation: "syncFieldState",
            }),
          ),
        ),
      );
      yield* DOMUtils.setInputValue(this.element, String(state.value ?? ""));

      // Update field display attributes (this will be handled by the state stream going forward)
      this.element.setAttribute("data-dirty", String(state.isDirty));
      this.element.setAttribute("data-touched", String(state.isTouched));
      this.element.setAttribute(
        "data-state",
        state.isValid ? "valid" : "invalid",
      );
    });
  }
}

/**
 * Utility function for creating field adapters
 */
export const createFieldAdapter = <T>(
  selector: string | HTMLElement,
  field: InputField<T>,
  config?: Partial<VanillaAdapterConfig>,
): Effect.Effect<VanillaFieldAdapter<T>, AdapterError> => {
  return Effect.gen(function* () {
    let element: HTMLElement;

    if (typeof selector === "string") {
      const domUtils = new DOMUtils();
      const found = yield* domUtils.query(selector);
      if (!found) {
        return yield* Effect.fail(
          new AdapterError({
            message: `Element not found: ${selector}`,
            operation: "createFieldAdapter",
          }),
        );
      }
      element = found;
    } else {
      element = selector;
    }

    if (!DOMUtils.isInputElement(element)) {
      return yield* Effect.fail(
        new AdapterError({
          message: "Element is not a valid input element",
          operation: "createFieldAdapter",
        }),
      );
    }

    const adapter = new VanillaFieldAdapter(element, field, config);
    yield* adapter.bind();
    return adapter;
  });
};
