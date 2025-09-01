# Flowline Forms: A-Z Architecture Guide

## 1. Introduction

### 1.1. Vision

This document outlines the architecture for **Flowline Forms**, a type-safe, composable, and modular forms library built for the Effect ecosystem. The primary goal is to provide developers with a powerful, platform-agnostic core for form state management and validation, complemented by a thin, extensible adapter layer for seamless integration with any user interface.

### 1.2. Document Scope

This architecture document defines the complete system design for Flowline Forms, including:

- **Core API Design**: State management patterns and functional interfaces
- **Module Structure**: Package organization and dependency relationships  
- **Implementation Standards**: Code conventions and testing requirements
- **Integration Patterns**: Adapter architecture for UI framework bindings

### 1.3. Decision Context

The architecture addresses specific challenges in form management:

- **Type Safety**: Leveraging TypeScript and Effect Schema for end-to-end type safety
- **Reactivity**: Atomic state management for fine-grained UI updates
- **Composability**: Functional approach enabling extensible form behaviors
- **Platform Agnostic**: Core logic independent of specific UI frameworks

### 1.4. Core Principles

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
  - **Key Exports**: `createForm`, `submit`, `setRawValue`, `touch`, `selectFieldState`, `selectIsValid`, `formatErrors`.

- `@flowline/forms-vanilla` **(Vanilla JS Adapter)**

  - **Responsibilities**: Binds the core engine to a standard HTML `<form>` element. It handles DOM event listeners, reads raw values from HTML inputs, and updates the DOM based on state changes from the core.

  * **Dependencies**: `@flowline/forms`, `effect`.
  * **Key Exports**: `bindForm`.

- **Future Adapters** (`@flowline/forms-react`, `@flowline/forms-svelte`, etc.)
  - This architecture is explicitly designed to support a family of adapters. Future packages can provide idiomatic wrappers, such as a `useForm` hook for React, which would manage the `Scope` and `Runtime` of the core `Form` object within the component lifecycle.

## 3. Deep Dive: `@flowline/forms` (The Core)

### 3.1. The `Form<A, I>` Object

This is the central, immutable handle for an active form instance. It contains no logic itself; it is a container for the two pillars of a form: its definition (`schema`) and its live state (`state`). The state is held in a `Writable` atom to allow actions to update it.

```typescript
import type { Writable } from "@effect-atom/atom";
import type { Schema } from "@effect/schema";

/**
 * A handle to a live form instance.
 * @param A The fully parsed and validated output type.
 * @param I The raw input type, before parsing and validation.
 */
export interface Form<A, I> {
  readonly schema: Schema.Schema<A, I>;
  readonly state: Writable<FormState<A, I>>;
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
   * Structured validation errors from @effect/schema. This is the
   * canonical, information-rich error tree. It is stored in its raw
   * form to allow for advanced error handling and introspection.
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
  1.  It returns a **scoped effect**. The implementation uses `Effect.contextWith` to require a `Scope` in the context, ensuring that the created atom's lifecycle is tied to that scope.
  2.  It accepts `initialValues` that match the **raw input type `I`**.
  3.  It synchronously runs an initial validation pass on the `initialValues` to ensure the `FormState` is fully populated from the very beginning.

### 3.4. Core Actions (The "Verbs")

These are the functions that drive all state changes in the form.

#### `setRawValue`

This is the workhorse for handling user input. It must be implemented as a single, atomic state transition.

- **Signature**: `setRawValue<A, I>(form: Form<A, I>, key: keyof I, value: I[keyof I]): Effect.Effect<void, never, AtomRegistry>`
- **Implementation Details**:
  1.  The operation uses `Atom.update(form.state, (currentState) => ...)`.
  2.  The callback function receives the `currentState` and returns a new, complete `FormState` object.
  3.  Inside the callback, it constructs the `newRawValues` and synchronously runs `Schema.decodeEither` to get the new `validatedValues` and `errors`.

#### `touch`

This action marks a field as having been interacted with.

- **Signature**: `touch<A, I>(form: Form<A, I>, key: keyof A): Effect.Effect<void, never, AtomRegistry>`
- **Implementation Details**: A simple `Atom.update` that adds the given `key` to the `touched` `ReadonlySet`.

#### `submit`

This action orchestrates the entire submission process, ensuring safety and predictability. The implementation uses a robust functional pipeline to avoid race conditions and stale state.

- **Signature**: `submit<A, I, E, R, R2>(onSubmit: (values: A) => Effect.Effect<R, E, R2>): Effect.Effect<R, E | ParseResult.ParseError | FormAlreadySubmittingError, AtomRegistry | R2>`
- **Implementation Details & Edge Cases**:
  1.  **Atomic Concurrency Control**: The process begins with `Atom.modify`. This performs an atomic check-and-set on the `isSubmitting` flag. If the form is already submitting, it immediately returns a failing `Effect` with a `FormAlreadySubmittingError`. If not, it sets `isSubmitting` to `true` and passes the current `rawValues` to the next stage. This pattern completely prevents race conditions.
  2.  **Functional Pipeline**: The `Effect` returned from `Atom.modify` is flattened and then piped into `Effect.flatMap` to create a clean, linear workflow that avoids nested callbacks and stale state.
  3.  **Validation**: Inside the `flatMap`, the fresh `rawValues` are decoded.
      - If decoding fails, the implementation chains two effects: first, `Atom.update` to set the `ParseError` in the form state, and then `Effect.fail` to fail the entire submission.
      - If decoding succeeds, the `onSubmit` callback provided by the user is returned, and its `Effect` is executed by the pipeline.
  4.  **Guaranteed Cleanup**: The entire pipeline is piped into `Effect.ensuring` at the end. This guarantees that an `Atom.update` effect to set `isSubmitting` back to `false` is executed, regardless of whether the submission succeeded or failed.

### 3.5. State Selectors and Error Formatting

Selectors provide an ergonomic and performant API for consuming form state. To simplify this consumption, the library provides both derived atom selectors and utility functions for processing the rich error data from `@effect/schema`.

#### **Error Formatting Utility**

To address the complexity of parsing the `ParseResult.ParseError` AST, the library leverages Effect's built-in `ArrayFormatter`. This provides a robust, maintainable way to get structured error messages without manually traversing the error tree.

- **`formatErrors` Utility**
  - **Signature**: `formatErrors(error: ParseResult.ParseError): Effect.Effect<ReadonlyMap<string | symbol, ReadonlyArray<string>>, never, never>`
  - **Implementation Approach**: Instead of manually parsing the complex `ParseError` AST, we use Effect's `ArrayFormatter` which handles all the complexity internally and provides a clean, structured output.
    1.  Use `ParseResult.ArrayFormatter.formatErrorSync(error)` to synchronously get an array of `ArrayFormatterIssue` objects for optimal performance in derived atoms.
    2.  Each `ArrayFormatterIssue` contains: `{ _tag: string, path: ReadonlyArray<PropertyKey>, message: string }`
    3.  Transform the array into a `ReadonlyMap` where:
        - **Key**: The field path joined as a string (or use a symbol for global errors)
        - **Value**: An array of error messages for that field
    4.  Handle path aggregation: multiple issues for the same path should be grouped together
    5.  For global errors (empty path), use a special symbol key like `GlobalErrorKey`

#### **Derived Atom Selectors**

- **Implementation Pattern**: `Atom.map(form.state, (formState) => selectData(formState))`

- **`FieldState<A, I>` Model**: To provide a structured view of a single field, selectors will produce a `FieldState` object.

  ```typescript
  import type { Option } from "effect/Option";

  export interface FieldState<A, I> {
    readonly rawValue: I;
    readonly value: Option<A>;
    readonly errors: ReadonlyArray<string>;
    readonly touched: boolean;
  }
  ```

- **`selectFieldState`**:
  - **Signature**: `selectFieldState<A, I>(form: Form<A, I>, key: keyof A): Atom.Atom<FieldState<A[keyof A], I[keyof I]>>`
  - **Implementation**: This selector is implemented as a derived atom using `Atom.map`. Since we use the synchronous `formatErrorSync`, the selector can operate without async complexity, providing optimal performance in reactive contexts.
  - **Implementation Steps**:
    1. Create a derived atom using `Atom.map` that transforms the form state into field-specific state
    2. Handle the optional errors by matching on `Option.None` and `Option.Some` cases
    3. For the `None` case, return an empty `Map` for formatted errors
    4. For the `Some` case, use the synchronous error formatter to process the `ParseError` into a structured map
    5. Extract the raw value for the specific field from `rawValues`
    6. Transform the validated values using `Option.map` to extract the field's validated value
    7. Retrieve field-specific errors from the formatted error map using the field key
    8. Check if the field has been touched by querying the `touched` set
    9. Return a `FieldState` object containing all computed field properties

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

- **Granular, Scoped Updates for Performance**: A naive implementation would re-render the whole form on any change. A performant and robust implementation will:

  1.  Use `Effect.forEach(Object.keys(form.schema.ast.propertySignatures), (key) => ..., { concurrency: "inherit", discard: true })` to spawn a concurrent fiber for each form field.
  2.  Each fiber will create a derived atom for its specific field using `selectFieldState(form, key)`.
  3.  The fiber will then subscribe to the stream of changes from this field-specific atom (`Atom.stream(fieldStateAtom)`) and perform targeted DOM updates for its corresponding input element and error message container.
  4.  Because this `Effect.forEach` is run within the `bindForm`'s scope, all field-specific subscription fibers are automatically and safely interrupted and cleaned up when the form is unbound.

- **Accessibility (A11y)**: This is a mandatory requirement.
  - When a field has an error, the input element MUST have `aria-invalid="true"`.
  - The corresponding error message element MUST have a unique `id`.
  * The input element MUST have `aria-describedby` pointing to the `id` of its error message element.
  * The submit button SHOULD have `aria-busy="true"` or `aria-disabled="true"` when `isSubmitting` is `true`.

## 5. Alternative Approaches Considered

### 5.1. State Management Alternatives

**Option 1: Direct Effect Ref Usage**
- **Rationale**: Use Effect's built-in `Ref` for state management
- **Decision**: Rejected in favor of effect-atom
- **Reason**: effect-atom provides superior reactivity and derived state capabilities

**Option 2: Manual Subscription Management** 
- **Rationale**: Implement custom reactive patterns without atomic state
- **Decision**: Rejected in favor of atomic approach
- **Reason**: Atomic state prevents unnecessary re-renders and simplifies state derivation

**Option 3: Framework-Specific Solutions**
- **Rationale**: Build separate libraries for React, Vue, etc.
- **Decision**: Rejected in favor of adapter pattern  
- **Reason**: Core/adapter separation maximizes code reuse and maintainability

### 5.2. Validation Architecture Alternatives

**Option 1: Custom Validation Framework**
- **Rationale**: Build proprietary validation system
- **Decision**: Rejected in favor of Effect Schema
- **Reason**: Effect Schema provides comprehensive type safety and ecosystem integration

**Option 2: Multiple Schema Library Support**
- **Rationale**: Support Zod, Joi, Yup alongside Effect Schema
- **Decision**: Rejected for single schema approach
- **Reason**: Single schema reduces complexity and maximizes type safety benefits

## 6. Code Style and Conventions

- **Naming Conventions**:

  - **Interfaces/Types**: `PascalCase` (e.g., `FormState`).
  - **Functions/Values**: `camelCase` (e.g., `createForm`).
  - **Action `Effect`s**: Must be verbs (`submit`, `setValue`).
  - **Constructor `Effect`s**: Must be prefixed with `create` (`createForm`).
  - **Selector functions**: Must be prefixed with `select` (`selectFieldState`) and return a reactive handle (e.g., an `Atom.Atom`).
  - **Context Propagation**: For functions that accept user-provided effects (like `onSubmit` in `submit`), an additional generic parameter (e.g., `R2`) should be used to represent the context required by the callback, and this parameter must be included in the final return type's context union (e.g., `AtomRegistry | R2`).

- **Error Handling**:

  - All custom, non-validation errors thrown by the library (e.g., an adapter error) MUST be an instance of a `Data.TaggedError`. For example, the `submit` action can fail with a `FormAlreadySubmittingError`.
  - The canonical type for validation errors is `ParseResult.ParseError`. The core library MUST NOT map or simplify this error type; it should be passed through to the adapter, which can then decide how to render it.

- **Documentation**:

  - All exported functions, interfaces, and types MUST have clear TSDoc comments explaining their purpose, parameters, and return values.

- **Testing**:
  - The `@flowline/forms` core module MUST be tested in complete isolation with unit tests, achieving high coverage.
  - The `@flowline/forms-vanilla` adapter requires integration tests running in a simulated DOM environment (e.g., Vitest with `jsdom` or browser mode).

## 7. Migration and Adoption Strategy

### 7.1. Implementation Phases

**Phase 1: Core Foundation**
- Implement `Form`, `FormState`, and `createForm` 
- Build core actions: `setRawValue`, `touch`, `submit`
- Establish error formatting and field selectors

**Phase 2: Vanilla Adapter**
- Create `bindForm` function with DOM event handling
- Implement reactive state synchronization
- Add accessibility compliance features

**Phase 3: Framework Adapters**  
- Develop React adapter with hooks integration
- Build Svelte adapter with reactive patterns
- Create Vue adapter with composition API support

### 7.2. Breaking Changes Policy

- **Major Version Changes**: Core API modifications require major version bump
- **Adapter Compatibility**: Framework adapters maintain independent versioning
- **Migration Guides**: Comprehensive upgrade documentation for each major release

### 7.3. Ecosystem Integration

- **Effect Compatibility**: Maintain compatibility with latest Effect versions
- **Schema Evolution**: Track `@effect/schema` API changes and adapt accordingly  
- **Community Feedback**: Regular architecture reviews based on user adoption patterns
