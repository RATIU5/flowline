import { Effect, Schema, Either } from "effect";
import type { ParseResult, Option, Scope } from "effect";
import { Atom, type Registry } from "@effect-atom/atom";

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

/**
 * A handle to a live form instance.
 * @param A The fully parsed and validated output type.
 * @param I The raw input type, before parsing and validation.
 */
export interface Form<A, I> {
  /**
   * The schema used to validate and parse the form values.
   */
  readonly schema: Schema.Schema<A, I>;

  /**
   * The current state of the form, including raw values,
   * validation errors, etc.
   */
  readonly state: Atom.Writable<FormState<A, I>>;
}

export interface CreateFormOptions<A, I> {
  /**
   * The schema used to validate and parse the form values.
   */
  schema: Form<A, I>["schema"];

  /**
   * The initial values for the form fields.
   */
  initialValues: I;
}

/**
 * Creates a new form instance with AtomRegistry automatically provided.
 *
 * @param options The options for creating the form.
 * @returns An effect that produces the new form instance.
 */
export const createForm = <A, I>(
  options: CreateFormOptions<A, I>,
): Effect.Effect<Form<A, I>, never, Scope.Scope | Registry.AtomRegistry> =>
  Effect.sync(() => {
    const validationResult = Schema.decodeEither(options.schema)(
      options.initialValues,
    );

    const initialState: FormState<A, I> = {
      rawValues: options.initialValues,
      validatedValues: Either.getRight(validationResult),
      errors: Either.getLeft(validationResult),
      touched: new Set<keyof A>(),
      isSubmitting: false,
    };

    const stateAtom = Atom.make(initialState);

    return {
      schema: options.schema,
      state: stateAtom,
    };
  });
