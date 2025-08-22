import { Effect, Layer, Runtime, Fiber, Record } from "effect";
import {
  FormService,
  FieldService,
  createForm as createCoreForm,
  type Form,
  type FormConfig,
  type FieldError,
} from "@flowline/forms";
import type { RuntimeConfig } from "../core/types.js";
import { AdapterError } from "../core/types.js";
import { VanillaFormAdapter } from "../adapters/form-adapter.js";

// Create a single, shared runtime for the entire application lifecycle.
// It is created asynchronously and stored in a promise.
const FormLayer = Layer.merge(FormService.Default, FieldService.Default);
const formRuntimePromise = Effect.runPromise(Effect.scoped(Layer.toRuntime(FormLayer)));

/**
 * Create and bind a form with the vanilla adapter in a non-Effect context.
 * This function uses a shared runtime to manage the form's lifecycle,
 * ensuring proper resource management (e.g., event listeners).
 *
 * @returns A promise that resolves with the form instance, its adapter, and a cleanup function.
 * The `cleanup` function must be called to release resources when the form is no longer needed.
 */
export const createForm = async <T extends Record<string, unknown>>(
  element: HTMLFormElement,
  config: FormConfig<T>,
  initialValues: T,
  runtimeConfig: RuntimeConfig = {},
): Promise<{
  form: Form<T>;
  adapter: VanillaFormAdapter<T>;
  cleanup: () => Promise<void>;
}> => {
  const runtime = await formRuntimePromise;
  const runFork = Runtime.runFork(runtime);
  const runPromise = Runtime.runPromise(runtime);

  const program = Effect.gen(function* () {
    const form = yield* createCoreForm(config, initialValues);
    const adapter = new VanillaFormAdapter(element, form);

    const fiber = runFork(adapter.bind());

    const cleanup = () => runPromise(Fiber.interrupt(fiber)).then(() => {});

    return { form, adapter, cleanup };
  }).pipe(
    Effect.catchAll((error) => {
      if (runtimeConfig.errorHandler) {
        runtimeConfig.errorHandler(error);
      } else if (runtimeConfig.logErrors !== false) {
        console.error("Form creation failed:", error);
      }
      return Effect.fail(error);
    }),
  );

  return runPromise(program);
};

/**
 * Create a form within an Effect context (for Effect-based applications).
 * This returns a scoped Effect, and the caller is responsible for providing the scope.
 */
export const createFormEffect = <T extends Record<string, unknown>>(
  element: HTMLFormElement,
  config: FormConfig<T>,
  initialValues: T,
): Effect.Effect<
  {
    form: Form<T>;
    adapter: VanillaFormAdapter<T>;
  },
  AdapterError | FieldError,
  FormService
> => {
  return Effect.gen(function* () {
    const form = yield* createCoreForm(config, initialValues);
    const adapter = yield* VanillaFormAdapter.create(element, form);

    return { form, adapter };
  });
};

/**
 * Utility to run any Effect using the shared runtime.
 * Provides simple callbacks for success and error handling.
 */
export const runEffect = async <A, E>(
  effect: Effect.Effect<A, E, FormService | FieldService>,
  options: {
    onSuccess?: (result: A) => void;
    onError?: (error: E) => void;
    logErrors?: boolean;
  } = {},
): Promise<A | undefined> => {
  const runtime = await formRuntimePromise;
  const runPromise = Runtime.runPromise(runtime);

  const program = effect.pipe(
    Effect.tap((result) => Effect.sync(() => options.onSuccess?.(result))),
    Effect.catchAll((error) => {
      if (options.onError) {
        options.onError(error);
      } else if (options.logErrors !== false) {
        console.error("Effect execution failed:", error);
      }
      return Effect.succeed(undefined);
    }),
  );
  return runPromise(program);
};

/**
 * Bind multiple forms at once, with a single cleanup function for all of them.
 * This is more efficient than creating and managing them individually.
 */
export const bindMultipleForms = async <
  T extends Record<string, Record<string, unknown>>,
>(
  forms: {
    [K in keyof T]: {
      element: HTMLFormElement;
      config: FormConfig<T[K]>;
      initialValues: T[K];
    };
  },
  runtimeConfig: RuntimeConfig = {},
) => {
  const runtime = await formRuntimePromise;
  const runFork = Runtime.runFork(runtime);
  const runPromise = Runtime.runPromise(runtime);

  const program = Effect.gen(function* () {
    const resultsEffects = Record.map(forms, (formData) =>
      Effect.gen(function* () {
        const form = yield* createCoreForm(
          formData.config,
          formData.initialValues,
        );
        const adapter = new VanillaFormAdapter(formData.element, form);
        return { form, adapter };
      }));

    const results = yield* Effect.all(resultsEffects);

    const adapters = Object.values(results).map((r) => r.adapter);
    const fibers = adapters.map((adapter) => runFork(adapter.bind()));

    const cleanup = () =>
      runPromise(Fiber.interruptAll(fibers)).then(() => {});

    return { ...results, cleanup };
  }).pipe(
    Effect.catchAll((error) => {
      if (runtimeConfig.errorHandler) {
        runtimeConfig.errorHandler(error);
      } else if (runtimeConfig.logErrors !== false) {
        console.error("Failed to bind multiple forms:", error);
      }
      return Effect.fail(error);
    }),
  );

  return runPromise(program);
};

/**
 * Quick setup for a single form by providing a selector or element.
 */
export const bindForm = <T extends Record<string, unknown>>(
  selector: string | HTMLFormElement,
  config: FormConfig<T>,
  initialValues: T,
  runtimeConfig?: RuntimeConfig,
): Promise<{
  form: Form<T>;
  adapter: VanillaFormAdapter<T>;
  cleanup: () => Promise<void>;
}> => {
  const element =
    typeof selector === "string"
      ? document.querySelector<HTMLFormElement>(selector)
      : selector;

  if (!element) {
    return Promise.reject(
      new AdapterError({
        message: `Form element not found: ${selector}`,
        operation: "bindForm",
      }),
    );
  }

  return createForm(element, config, initialValues, runtimeConfig);
};

/**
 * Auto-bind all forms on a page that have the `data-flowline-form` attribute.
 * Returns an array of form instances, each with its own cleanup function.
 */
export const autoBindForms = (
  rootElement: Document | Element = document,
  runtimeConfig?: RuntimeConfig,
): Promise<
  Array<{
    element: HTMLFormElement;
    form: Form<Record<string, unknown>>;
    adapter: VanillaFormAdapter<Record<string, unknown>>;
    cleanup: () => Promise<void>;
  }>
> => {
  const forms = rootElement.querySelectorAll<HTMLFormElement>(
    "[data-flowline-form]",
  );

  const promises = Array.from(forms).map(async (element) => {
    const formName = element.dataset.flowlineForm || "unnamed";
    const validateOnChange = element.dataset.validateOnChange !== "false";
    const validateOnBlur = element.dataset.validateOnBlur !== "false";

    const formData = new FormData(element);
    const initialValues: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      initialValues[key] = value;
    });

    const config: FormConfig<Record<string, unknown>> = {
      name: formName,
      validateOnChange,
      validateOnBlur,
    };

    const result = await createForm(
      element,
      config,
      initialValues,
      runtimeConfig,
    );

    return {
      element,
      ...result,
    };
  });

  return Promise.all(promises);
};
