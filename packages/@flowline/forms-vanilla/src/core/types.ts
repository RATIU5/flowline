import type { Effect, Record } from "effect";
import { Data } from "effect";
import type { Form, Field, FieldValidationError, InputField } from "@flowline/forms";

export interface VanillaAdapterConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly autoDiscover?: boolean;
  readonly validateOnInput?: boolean;
  readonly validateOnBlur?: boolean;
  readonly debounceMs?: number;
  readonly preventDefault?: boolean;
  readonly onSubmit?: (
    values: T,
  ) => Effect.Effect<unknown, FieldValidationError, never>;
  readonly errorRenderer?: (
    fieldName: string,
    errors: readonly FieldValidationError[],
  ) => HTMLElement | null;
  readonly errorSelector?: (fieldName: string) => string;
}

export interface Adapter {
  readonly element: HTMLElement;
  readonly config: VanillaAdapterConfig;
  bind(): Effect.Effect<void, AdapterError>;
  unbind(): Effect.Effect<void, AdapterError>;
}

export interface FormAdapter<T extends Record<string, unknown>> extends Adapter {
  readonly form: Form<T>;
  readonly element: HTMLFormElement;
  getFieldElement(name: keyof T): Effect.Effect<HTMLElement | null, AdapterError>;
  syncFormState(): Effect.Effect<void, AdapterError>;
}

export interface FieldAdapter<T> extends Adapter {
  readonly field: Field<T>;
  readonly element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  getValue(): Effect.Effect<T, AdapterError>;
  setValue(value: T): Effect.Effect<void, AdapterError>;
}

export class AdapterError extends Data.TaggedError("AdapterError")<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export interface ElementSelector<T extends HTMLElement = HTMLElement> {
  query(selector: string): Effect.Effect<T | null, AdapterError>;
  queryAll(selector: string): Effect.Effect<NodeListOf<T>, AdapterError>;
  findByName(name: string): Effect.Effect<T | null, AdapterError>;
  findFormFields(): Effect.Effect<Record<string, HTMLElement>, AdapterError>;
}

export interface EventBindingConfig {
  readonly preventDefault?: boolean;
  readonly stopPropagation?: boolean;
  readonly debounceMs?: number;
}

export type CleanupFn = () => void;

export interface RuntimeConfig {
  readonly useAsyncRuntime?: boolean;
  readonly errorHandler?: (error: unknown) => void;
  readonly logErrors?: boolean;
}