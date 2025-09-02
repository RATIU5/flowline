import { Data, Effect, Either, type ParseResult, Schema } from "effect";
import { Atom } from "@effect-atom/atom";
import type { AtomRegistry } from "@effect-atom/atom/Registry";
import type { Form } from "./form";

export class FormAlreadySubmittingError extends Data.TaggedError(
  "@flowline/forms/actions/FormAlreadySubmittingError",
) { }

/**
 * Sets the raw value of a form field.
 *
 * @param form The form instance.
 * @param key The key of the field to update.
 * @param value The new value for the field.
 * @returns An effect that updates the form state.
 */
export const setRawValue = <A, I>(
  form: Form<A, I>,
  key: keyof I,
  value: I[keyof I],
): Effect.Effect<void, never, AtomRegistry> =>
  Atom.update(form.state, (currentState) => {
    const newRawValues = {
      ...currentState.rawValues,
      [key]: value,
    };

    const validatedValues = Schema.decodeEither(form.schema, { errors: "all" })(newRawValues);
    const newState = {
      ...currentState,
      rawValues: newRawValues,
      validatedValues: Either.getRight(validatedValues),
      errors: Either.getLeft(validatedValues),
    };

    return newState;
  });

/**
 * Marks a form field as touched.
 *
 * @param form The form instance.
 * @param key The key of the field to mark as touched.
 * @returns An effect that updates the form state.
 */
export const touch = <A, I>(
  form: Form<A, I>,
  key: keyof A,
): Effect.Effect<void, never, AtomRegistry> =>
  Atom.update(form.state, (currentState) => {
    const newState = {
      ...currentState,
      touched: new Set<keyof A>(currentState.touched).add(key),
    };

    return newState;
  });

/**
 * Submits the form. Triggers validation and calls the onSubmit function if the form is valid.
 *
 * @param form The form instance.
 * @param onSubmit The function to call on form submission.
 * @returns An effect that submits the form.
 */
export const submit = <A, I, E, R, R2>(
  form: Form<A, I>,
  onSubmit: (values: A) => Effect.Effect<R, E, R2>,
): Effect.Effect<
  R,
  E | ParseResult.ParseError | FormAlreadySubmittingError,
  AtomRegistry | R2
> => {
  const getRawValuesAndSetSubmitting = Atom.modify(
    form.state,
    (currentState) => {
      if (currentState.isSubmitting) {
        const effect: Effect.Effect<I, FormAlreadySubmittingError> =
          Effect.fail(new FormAlreadySubmittingError());
        return [effect, currentState] as const;
      }

      const effect: Effect.Effect<I, FormAlreadySubmittingError> =
        Effect.succeed(currentState.rawValues);
      const newState = { ...currentState, isSubmitting: true };
      return [effect, newState] as const;
    },
  );

  const submissionPipeline = getRawValuesAndSetSubmitting.pipe(
    Effect.flatten,
    Effect.flatMap(
      (
        rawValues,
      ): Effect.Effect<R, E | ParseResult.ParseError, AtomRegistry | R2> => {
        const validatedValues = Schema.decodeEither(form.schema, { errors: "all" })(rawValues);
        if (Either.isLeft(validatedValues)) {
          return Atom.update(form.state, (currentState) => ({
            ...currentState,
            errors: Either.getLeft(validatedValues),
            hasSubmitted: true,
          })).pipe(Effect.andThen(Effect.fail(validatedValues.left)));
        }
        return onSubmit(validatedValues.right);
      },
    ),
  );

  return submissionPipeline.pipe(
    Effect.ensuring(
      Atom.update(form.state, (currentState) => {
        return {
          ...currentState,
          isSubmitting: false,
          hasSubmitted: true,
        };
      }),
    ),
  );
};
