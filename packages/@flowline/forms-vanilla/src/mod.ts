// Main exports for @flowline/forms-vanilla
// Vanilla TypeScript/JavaScript adapter for @flowline/forms

// Core types and interfaces
export type {
  VanillaAdapterConfig,
  Adapter,
  FormAdapter,
  FieldAdapter,
  ElementSelector,
  EventBindingConfig,
  CleanupFn,
  RuntimeConfig,
} from "./core/types.js";

export { AdapterError } from "./core/types.js";

// DOM utilities
export { DOMUtils } from "./core/dom-utils.js";

// Form adapter
export { VanillaFormAdapter } from "./adapters/form-adapter.js";

// Field adapter
export { VanillaFieldAdapter, createFieldAdapter } from "./adapters/field-adapter.js";

// Runtime utilities for Effect and non-Effect contexts
export {
  createForm,
  createFormEffect,
  runEffect,
  bindMultipleForms,
  bindForm,
  autoBindForms,
} from "./runtime/vanilla-runtime.js";

// Re-export commonly used types from core forms library
export type { Form, Field, FormConfig, FormState } from "@flowline/forms";