import { Duration, Effect, Stream, type Scope } from "effect";
import { setRawValue, submit, type Form } from "@flowline/forms";
import { fromEvent } from "./events";
import { Registry } from "@effect-atom/atom";

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
    const inputs = params.element.querySelectorAll("input, select, textarea") as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

    for (const input of inputs) {

    }

    const submitProcess = fromEvent(params.element, "submit").pipe(
      Stream.flatMap((e) => {
        const handleEventEffect = Effect.gen(function* () {
          e.preventDefault();
          const effect = submit(params.form, (values) =>
            params.onSubmit(values, e),
          );
          const effectWithR2Provided = Effect.provide(effect, r2Context);
          yield* effectWithR2Provided;
        }).pipe(
          Effect.catchTag("ParseError", (error) => Effect.gen(function* () {
            yield* Effect.logDebug("Parse error occurred:", error.toString());
            yield* Effect.succeed(undefined);
          })),
          Effect.catchTag("@flowline/forms/actions/FormAlreadySubmittingError", () => Effect.succeed(undefined))
        );
        return Stream.fromEffect(handleEventEffect);
      }),
      Stream.runDrain,
    );

    const inputProcess = fromEvent(params.element, "input").pipe(
      Stream.debounce(Duration.millis(300)),
      Stream.flatMap((e) => {
        const target = e.target as HTMLInputElement;
        const name = target.name as keyof I;
        const value = target.value as I[keyof I];
        const handleEventEffect =
          setRawValue(params.form, name, value);
        return Stream.fromEffect(handleEventEffect);
      }),
      Stream.runDrain,
    );

    const allProcesses = [submitProcess, inputProcess];

    const listeners = Effect.all(allProcesses, { discard: true });
    yield* Effect.forkScoped(listeners);
    yield* Effect.never;
  });

export const runForm = <E>(program: Effect.Effect<void, E, Scope.Scope | Registry.AtomRegistry>) => {
  const programWithDeps = Effect.provide(program, Registry.layer);
  return Effect.scoped(programWithDeps);
}
