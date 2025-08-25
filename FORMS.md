# Flowline Forms: A-Z Architecture Guide

## 1. Introduction

### 1.1. Vision

This document outlines the architecture for **Flowline Forms**, a type-safe, composable, and modular forms library built for the Effect ecosystem. The primary goal is to provide developers with a powerful, platform-agnostic core for form state management and validation, complemented by a thin, extensible adapter layer for seamless integration with any user interface.

### 1.2. Core Principles

The entire architecture is founded on four guiding principles. Adherence to these principles is paramount for maintaining the library's quality and achieving its vision.

1.  **Schema-Driven Development**: The `@effect/schema` library is the **single source of truth**. A form's data shape, validation rules, error messages, and type coercions are all defined within a single `Schema` object. This approach eliminates configuration drift, centralizes business logic, and provides unparalleled type safety from the data model to the UI.

2.  **Data-Oriented Design**: We favor simple, immutable data structures over classes with methods. The form's state is a transparent, predictable data structure. All logic is externalized into functions that operate on this state. This enhances debuggability, simplifies reasoning about state transitions, and aligns with functional programming paradigms.

3.  **Functional & Composable API**: All state modifications and side effects are executed via standalone, reusable `Effect`s. This "verbs-on-nouns" approach allows developers to easily wrap, extend, or compose library functionality to meet custom requirements (e.g., adding auto-save, logging, or multi-step wizard logic) without modifying the library's core. Avoid OOP design patterns if possible.

4.  **Decoupled Core & UI**: The core logic is pure and platform-agnostic, with zero dependencies on the DOM or any UI framework. The UI adapter is a thin, "dumb" bridge, responsible only for translating UI events into core actions and syncing state back to the view. This separation ensures the core is eminently testable and that the library is portable to any environment.

## 2. Module Architecture

The library is structured as a monorepo containing distinct, versioned packages.

- `@flowline/forms` **(Core Engine)**

  - **Responsibilities**: Manages all form state, executes validation and coercion logic, and exposes composable actions and state selectors. It is the brain of the library.
  - **Dependencies**: `effect`, `@effect/schema`, `@effect-atom/atom`.
  - **Key Exports**: `createForm`, `submit`, `setRawValue`, `touch`, `selectFieldState`, `selectIsValid`.

- `@flowline/forms-vanilla` **(Vanilla JS Adapter)**

  - **Responsibilities**: Binds the core engine to a standard HTML `<form>` element. It handles DOM event listeners, reads raw values from HTML inputs, and updates the DOM based on state changes from the core.

  * **Dependencies**: `@flowline/forms`, `effect`.
  * **Key Exports**: `bindForm`.

- **Future Adapters** (`@flowline/forms-react`, `@flowline/forms-svelte`, etc.)
  - This architecture is explicitly designed to support a family of adapters. Future packages can provide idiomatic wrappers, such as a `useForm` hook for React, which would manage the `Scope` and `Runtime` of the core `Form` object within the component lifecycle.

## 3. Deep Dive: `@flowline/forms` (The Core)

### 3.1. The `Form<A, I>` Object

This is the central, immutable handle for an active form instance. It contains no logic itself; it is a container for the two pillars of a form: its definition (`schema`) and its live state (`state`).

```typescript
import type { Atom } from "@effect-atom/atom";
import type { Schema } from "@effect/schema";

/**
 * A handle to a live form instance.
 * @param A The fully parsed and validated output type.
 * @param I The raw input type, before parsing and validation.
 */
export interface Form<A, I> {
  readonly schema: Schema.Schema<A, I>;
  readonly state: Atom.Atom<FormState<A, I>>;
}
```

### 3.2. The `FormState<A, I>` Model

This is the complete, immutable snapshot of the form's state at any point in time. It lives inside an `Atom` to provide powerful and ergonomic reactive updates.

```typescript
import type { Option } from "effect/Option";
import type { ParseResult } from "@effect/schema";

export interface FormState<A, I> {
  /**
   * The raw, untrusted values from the UI. This is the direct
   * representation of what the user has typed.
   */
  readonly rawValues: I;

  /**
   * The successfully parsed and typed values. This is the "trusted"
   * state that should be consumed by application logic. It is an
   * Option because parsing can fail.
   */
  readonly validatedValues: Option.Option<A>;

  /**
   * Structured validation errors from @effect/schema. This is an
   * Option because there may be no errors. The ParseError tree
   * contains rich information about why validation failed.
   */
  readonly errors: Option.Option<ParseResult.ParseError>;

  /**
   * A set of field keys that have been interacted with (e.g., blurred).
   * This is crucial for UX decisions, like only showing an error
   * message after a user has interacted with a field.
   */
  readonly touched: ReadonlySet<keyof A>;

  /**
   * A flag indicating if a submission is currently in progress.
   * Used to prevent concurrent submissions and provide UI feedback.
   */
  readonly isSubmitting: boolean;
}
```

### 3.3. The `createForm` Constructor

This is the primary entry point for instantiating a form.

- **Signature**: `createForm<A, I>(options: { schema: Schema.Schema<A, I>, initialValues: I }): Effect.Effect<Form<A, I>, never, Scope.Scope>`
- **Behavior**:
  1.  It returns a **scoped effect**. It uses `Atom.make` to create the reactive state container. `Atom`s are inherently scoped, meaning they are automatically garbage collected when the `Scope` they are created in is closed, preventing memory leaks.
  2.  It accepts `initialValues` that match the **raw input type `I`**, mirroring the initial state of a UI form.
  3.  Upon creation, it immediately runs an initial validation pass on the `initialValues`. This ensures the `FormState` is fully populated from the very beginning with `rawValues`, and an initial `validatedValues` and `errors` state.

### 3.4. Core Actions (The "Verbs")

These are the functions that drive all state changes in the form. They leverage `Atom.update` for safe, atomic state transitions.

#### `setRawValue`

This is the workhorse for handling user input. It must be implemented as a single, atomic state transition.

- **Signature**: `setRawValue<A, I>(form: Form<A, I>, key: keyof I, value: I[keyof I]): Effect.Effect<void, never>`
- **Implementation Details**:
  1.  The entire operation MUST use `Atom.update(form.state, (currentState) => ...)`.
  2.  Inside the update function, it receives the `currentState`.
  3.  It constructs the `newRawValues` object by merging the incoming `key` and `value` with the `currentState.rawValues`.
  4.  It then **synchronously** runs `Schema.decode(form.schema)(newRawValues)`.
  5.  The result of the decoding (`Either<ParseError, A>`) is used to determine the new `validatedValues` and `errors`.
  6.  A complete, new `FormState` object is constructed and returned from the update function. This atomic update prevents any possibility of race conditions or inconsistent intermediate states.

#### `touch`

This action marks a field as having been interacted with.

- **Signature**: `touch<A, I>(form: Form<A, I>, key: keyof A): Effect.Effect<void, never>`
- **Implementation Details**: A simple `Atom.update` that adds the given `key` to the `touched` `ReadonlySet`.

#### `submit`

This action orchestrates the entire submission process, ensuring safety and predictability.

- **Signature**: `submit<A, I, E, R>(form: Form<A, I>, onSubmit: (values: A) => Effect.Effect<R, E>): Effect.Effect<R, E | ParseResult.ParseError>`
- **Implementation Details & Edge Cases**:
  1.  **Concurrency Control**: The very first step is to read the atom's state with `Atom.get(form.state)` and check if `isSubmitting` is already `true`. If so, the effect should immediately yield, doing nothing.
  2.  **Transactional State**: The workflow is wrapped in `Effect.acquireUseRelease`.
      - **Acquire**: Sets `isSubmitting` to `true` using `Atom.update`.
      - **Use**:
        - Decodes the current `rawValues` using the schema.
        - If decoding fails, it updates the `errors` in the state via `Atom.update` and fails the effect with the `ParseError`.
        - If decoding succeeds, it invokes the user-provided `onSubmit(validatedValues)` effect.
      - **Release**: This block is **guaranteed** to execute. It sets `isSubmitting` back to `false` via `Atom.update`, ensuring the form never gets stuck in a submitting state, even if the `onSubmit` handler fails.

### 3.5. State Selectors (The "Lenses") with Derived Atoms

Selectors provide an ergonomic and performant API for consuming form state. Instead of manually constructing streams, we leverage the power of **derived atoms** from `effect-atom` for simplicity and performance.

- **Implementation Pattern**: `Atom.map(form.state, (formState) => selectData(formState))`

  - A derived atom is a memoized computation that depends on other atoms.
  - It automatically and efficiently re-computes its value only when the upstream data it depends on has actually changed. This provides optimal performance out of the box.

- **`selectFieldState` (Now Simplified)**:
  - **Signature**: `selectFieldState<A, I>(form: Form<A, I>, key: keyof A): Atom.Atom<FieldState, never>`
  - **Implementation**: This selector is now implemented as a derived atom. The complex logic for finding a field-specific error is placed inside the atom's mapping function.
  - **Example**: `Atom.map(form.state, (s) => ({ value: s.rawValues[key], error: findErrorForKey(s.errors, key), touched: s.touched.has(key) }))`
  - This derived atom (`FieldState` atom) can be passed directly to UI components, which can subscribe to it and will only re-render when that specific field's state changes.

## 4. Deep Dive: `@flowline/forms-vanilla` (The Adapter)

### 4.1. The `bindForm` Function

This is the main entry point for users of the vanilla adapter. It orchestrates the entire binding process.

- **Signature**: `bindForm<A, I>(options: { form: Form<A, I>, element: HTMLFormElement, options?: { debounceMs?: number } }): Effect.Effect<void, never, Scope.Scope>`
- **Behavior**: Returns a scoped `Effect`. The user is responsible for running this effect within a `Scope` (e.g., for the lifetime of a page or component). When the scope is closed, all event listeners and state subscriptions are automatically and safely torn down.

### 4.2. DOM Event Handling (DOM -> Core)

- **Event Delegation**: For performance, listeners for `input` and `blur` events should be attached to the root `<form>` element, not to individual inputs.
- **Debouncing**: The stream of `input` events must be piped through `Stream.debounce` (defaulting to ~300ms) before triggering the `setRawValue` action. This prevents performance issues from excessive validation on rapid user input.
- **Value Extraction (Tricky Part)**: The adapter must reliably produce the raw `I` value for the core. This requires specific logic for different input types:

| Input Type            | Attribute                  | Raw Value Produced                  |
| :-------------------- | :------------------------- | :---------------------------------- |
| `text`, `email`, etc. | `value`                    | `string`                            |
| `number`              | `value`                    | `string` (coercion is schema's job) |
| `checkbox` (single)   | `checked`                  | `boolean`                           |
| `checkbox` (group)    | `name`, `value`, `checked` | `Array<string>` of checked values   |
| `radio`               | `name`, `value`, `checked` | `string` (value of selected radio)  |
| `select-one`          | `value`                    | `string`                            |
| `select-multiple`     | `options`                  | `Array<string>` of selected values  |

### 4.3. State Synchronization (Core -> DOM)

- **Granular Updates via Derived Atoms**: The use of derived atoms in the core makes performant UI updates in the adapter straightforward.

  1.  Iterate over the keys of the form's schema (`Object.keys(form.schema.ast.propertySignatures)`).
  2.  For each field key, create its dedicated derived atom using `selectFieldState(form, key)`.
  3.  Launch a **separate fiber** for each field that subscribes to changes from its derived atom. This can be done via `Atom.stream(fieldStateAtom)` and then running an effect on that stream.
  4.  This ensures that a change in one field's state _only_ triggers a DOM update for that specific field's input and error message container, achieving maximum performance and surgical precision in UI updates.

- **Accessibility (A11y)**: This is a mandatory requirement.
  - When a field has an error, the input element MUST have `aria-invalid="true"`.
  - The corresponding error message element MUST have a unique `id`.
  * The input element MUST have `aria-describedby` pointing to the `id` of its error message element.
  * The submit button SHOULD have `aria-busy="true"` or `aria-disabled="true"` when `isSubmitting` is `true`.

## 5. Code Style and Conventions

- **Naming Conventions**:
  - **Interfaces/Types**: `PascalCase` (e.g., `FormState`).
  - **Functions/Values**: `camelCase` (e.g., `createForm`).
  - **Action `Effect`s**: Must be verbs (`submit`, `setValue`).
  - **Constructor `Effect`s**: Must be prefixed with `create` (`createForm`).
  - **Selector functions**: Must be prefixed with `select` (`selectFieldState`) and return a reactive handle (e.g., an `Atom.Atom`).
- **Error Handling**:
  - All custom, non-validation errors thrown by the library (e.g., an adapter error) MUST be an instance of a `Data.TaggedError`.
  - The canonical type for validation errors is `ParseResult.ParseError`. The core library MUST NOT map or simplify this error type; it should be passed through to the adapter, which can then decide how to render it.
- **Documentation**:
  - All exported functions, interfaces, and types MUST have clear TSDoc comments explaining their purpose, parameters, and return values.
- **Testing**:
  - The `@flowline/forms` core module MUST be tested in complete isolation with unit tests, achieving high coverage.
  - The `@flowline/forms-vanilla` adapter requires integration tests running in a simulated DOM environment (e.g., Vitest with `jsdom` or browser mode).