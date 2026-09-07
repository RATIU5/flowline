import { Effect, Predicate } from "effect";
import { Terminal } from "effect/Terminal";
import { Prompt } from "effect/unstable/cli";

import { paint, plain } from "./style";

interface State {
  readonly index: number;
  readonly selected: ReadonlySet<number>;
}

/** Shared keyboard behavior for every screen. Esc cancels only this prompt. */
const picker = <A>(
  options: Prompt.SelectOptions<A>,
  multiple: boolean,
  radio = false,
): Prompt.Prompt<readonly A[] | null> => {
  const choices = options.choices;
  const initial = Math.max(
    0,
    choices.findIndex((choice) => choice.selected && !choice.disabled),
  );
  let rendered = 0;
  return Prompt.custom<State, readonly A[] | null>(
    {
      index: initial,
      selected: new Set(
        choices.flatMap((choice, index) =>
          choice.selected && !choice.disabled ? [index] : [],
        ),
      ),
    },
    {
      render: (state, action) =>
        Effect.gen(function* () {
          if (Predicate.isTagged("Beep")(action)) return "\x07";
          if (Predicate.isTagged("Submit")(action)) return "";
          const terminal = yield* Terminal;
          const width = Math.max(1, (yield* terminal.columns) - 1);
          const height = yield* terminal.rows;
          const clip = (value: string) => {
            const text = plain(value);
            return text.length > width
              ? `${text.slice(0, Math.max(0, width - 3))}...`.slice(0, width)
              : text;
          };
          const size = Math.max(
            1,
            Math.min(options.maxPerPage ?? 8, height - 13),
          );
          const start = Math.max(
            0,
            Math.min(state.index - Math.floor(size / 2), choices.length - size),
          );
          const lines = [paint("bold", clip(options.message))];
          for (
            let index = start;
            index < Math.min(choices.length, start + size);
            index++
          ) {
            const choice = choices[index];
            const marker = multiple
              ? state.selected.has(index)
                ? "[x]"
                : "[ ]"
              : radio
                ? index === state.index
                  ? "(*)"
                  : "( )"
                : index === state.index
                  ? ">"
                  : " ";
            lines.push(
              paint(
                choice.disabled
                  ? "muted"
                  : index === state.index
                    ? "accent"
                    : "normal",
                clip(`${marker} ${choice.title}`),
              ),
            );
          }
          const current = choices[state.index];
          lines.push(
            "",
            paint(
              "muted",
              clip(
                current?.description ??
                  (choices.length
                    ? `${state.index + 1} / ${choices.length}`
                    : ""),
              ),
            ),
          );
          rendered = lines.length;
          return lines.join("\n");
        }),
      process: (input, state) => {
        const name = input.key.name;
        if (name === "escape")
          return Effect.succeed({ _tag: "Submit", value: null });
        if (name === "enter" || name === "return") {
          if (multiple)
            return Effect.succeed({
              _tag: "Submit",
              value: choices
                .filter((_, i) => state.selected.has(i))
                .map((choice) => choice.value),
            });
          const choice = choices[state.index];
          return choice && !choice.disabled
            ? Effect.succeed({ _tag: "Submit", value: [choice.value] })
            : Effect.succeed({ _tag: "Beep" });
        }
        if (
          multiple &&
          name === "space" &&
          choices[state.index] &&
          !choices[state.index].disabled
        ) {
          const selected = new Set(state.selected);
          if (selected.has(state.index)) selected.delete(state.index);
          else selected.add(state.index);
          return Effect.succeed({
            _tag: "NextFrame",
            state: { ...state, selected },
          });
        }
        let index = state.index;
        if (name === "up" || name === "k")
          index = (index + choices.length - 1) % choices.length;
        else if (name === "down" || name === "j" || name === "tab")
          index = (index + 1) % choices.length;
        else if (name === "home") index = 0;
        else if (name === "end") index = choices.length - 1;
        else return Effect.succeed({ _tag: "Beep" });
        return choices.length
          ? Effect.succeed({ _tag: "NextFrame", state: { ...state, index } })
          : Effect.succeed({ _tag: "Beep" });
      },
      clear: () =>
        Effect.sync(
          () =>
            "\r\x1b[2K" + "\x1b[1A\r\x1b[2K".repeat(Math.max(0, rendered - 1)),
        ),
    },
  );
};

export const select = <A>(options: Prompt.SelectOptions<A>) =>
  picker(options, false).pipe(Prompt.map((values) => values?.[0] ?? null));
export const multiSelect = <A>(options: Prompt.SelectOptions<A>) =>
  picker(options, true).pipe(Prompt.map((values) => values ?? []));
export const confirm = (options: Prompt.ConfirmOptions) =>
  select({
    message: options.message,
    choices: [
      { title: "Yes", value: true, selected: options.initial === true },
      { title: "No", value: false, selected: options.initial !== true },
    ],
  }).pipe(Prompt.map((value) => value === true));
export const radio = <A>(options: Prompt.SelectOptions<A>) =>
  picker(options, false, true).pipe(
    Prompt.map((values) => values?.[0] ?? null),
  );
