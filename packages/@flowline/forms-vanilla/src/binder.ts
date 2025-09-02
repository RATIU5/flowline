import { Duration, Effect, Stream, type Scope } from "effect";
import { Atom, Registry } from "@effect-atom/atom";
import { selectFieldState, setRawValue, submit, type Form } from "@flowline/forms";
import { fromEvent } from "./events";

export interface BindFormOptions {
  /**
   * The debounce time in milliseconds for form input changes.
   */
  debounceMs?: number;
}

export interface BindFormParams<A, I, E, R2> {
  /**
   * The form instance to bind.
   */
  form: Form<A, I>;

  /**
   * The HTML form element to bind to.
   */
  element: HTMLFormElement;

  /**
   * The function to call when the form is submitted.
   */
  onSubmit: (formData: A, event: SubmitEvent) => Effect.Effect<void, E, R2>;

  /**
   * Options for binding the form.
   */
  options?: BindFormOptions;
}

export const bindForm = <A, I, E, R2>(
  params: BindFormParams<A, I, E, R2>,
): Effect.Effect<void, never, Scope.Scope | R2 | Registry.AtomRegistry> =>
  Effect.gen(function* () {
    const r2Context = yield* Effect.context<R2>();
    const inputs = params.element.querySelectorAll(
      "input, select, textarea",
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

    yield* Stream.fromEffect(
      Effect.void
    ).pipe(
      Stream.flatMap(() => {
        const inputStreams = Array.from(inputs).map((input) => {
          const inputName = input.getAttribute("name") as keyof A & keyof I;
          if (!inputName) {
            return Stream.empty;
          }

          const fieldStateAtom = selectFieldState(params.form.state, inputName);

          return Atom.toStream(fieldStateAtom).pipe(
            Stream.tap((state) => Effect.sync(() => {
              if (!state.hasSubmitted) {
                return;
              }

              const errorElement = params.element.querySelector(`#${String(inputName)}-error`);
              if (errorElement) {
                errorElement.textContent = state.errors[0] ?? "";
              }

              const hasError = state.errors.length > 0;
              input.setAttribute("aria-invalid", String(hasError));
              input.setAttribute("data-state", hasError ? "invalid" : "valid");
            }))
          );
        });

        return Stream.mergeAll(inputStreams, { concurrency: "unbounded" });
      }),
      Stream.runDrain,
      Effect.forkScoped
    );

    yield* fromEvent(params.element, "submit").pipe(
      Stream.flatMap((e) => {
        const handleEventEffect = Effect.gen(function* () {
          e.preventDefault();
          const effect = submit(params.form, (values) =>
            params.onSubmit(values, e),
          );
          const effectWithR2Provided = Effect.provide(effect, r2Context);
          yield* effectWithR2Provided;
        }).pipe(
          Effect.catchTag("ParseError", (error) =>
            Effect.gen(function* () {
              yield* Effect.logDebug("Parse error occurred:", error.toString());
              yield* Effect.succeed(undefined);
            }),
          ),
          Effect.catchTag(
            "@flowline/forms/actions/FormAlreadySubmittingError",
            () => Effect.succeed(undefined),
          ),
        );
        return Stream.fromEffect(handleEventEffect);
      }),
      Stream.runDrain,
      Effect.forkScoped
    );

    yield* fromEvent(params.element, "input").pipe(
      Stream.debounce(Duration.millis(300)),
      Stream.flatMap((e) => {
        const target = e.target as HTMLInputElement;
        const name = target.name as keyof I;
        const value = target.value as I[keyof I];
        const handleEventEffect = setRawValue(params.form, name, value);
        return Stream.fromEffect(handleEventEffect);
      }),
      Stream.runDrain,
      Effect.forkScoped
    );

    yield* Effect.never;
  });

export const runForm = <E>(
  program: Effect.Effect<void, E, Scope.Scope | Registry.AtomRegistry>,
) => {
  const programWithDeps = Effect.provide(program, Registry.layer);
  return Effect.scoped(programWithDeps);
};
