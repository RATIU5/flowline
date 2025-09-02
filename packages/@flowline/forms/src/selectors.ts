import { Option } from "effect";
import { Atom } from "@effect-atom/atom";
import type { Form } from "./form";
import { formatErrors } from "./errors";

export interface FieldState<A, I> {
  readonly rawValue: I;
  readonly value: Option.Option<A>;
  readonly errors: ReadonlyArray<string>;
  readonly touched: boolean;
  readonly hasSubmitted: boolean;
}

/**
 * Selects the state of a form field.
 *
 * @param form The form instance.
 * @param key The key of the field to select.
 * @returns An atom representing the field state.
 */
export const selectFieldState = <A, I>(
  state: Form<A, I>["state"],
  key: keyof A & keyof I,
): Atom.Atom<FieldState<A[keyof A], I[keyof I]>> =>
  Atom.map(state, (s) => {
    const formattedErrors = s.errors.pipe(
      Option.match({
        onNone: () => new Map<string | symbol, ReadonlyArray<string>>(),
        onSome: (error) => formatErrors(error),
      }),
    );

    return {
      rawValue: s.rawValues[key],
      value: Option.map(s.validatedValues, (a) => a[key]),
      errors: formattedErrors.get(String(key)) ?? [],
      touched: s.touched.has(key),
      hasSubmitted: s.hasSubmitted,
    };
  });
