import { BunServices } from "@effect/platform-bun";
import { expect, test } from "bun:test";
import { Effect, Option, Queue, Terminal } from "effect";
import { Prompt } from "effect/unstable/cli";

import { confirm, multiSelect, select } from "../src/dependencies/navigation";
import { radioSelect } from "../src/dependencies/radio";

const runKeys = <A>(prompt: Prompt.Prompt<A>, keys: readonly string[]) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const input = yield* Queue.make<Terminal.UserInput>();
      yield* Queue.offerAll(
        input,
        keys.map((name) => ({
          input: Option.none<string>(),
          key: { name, ctrl: false, meta: false, shift: false },
        })),
      );
      const terminal = Terminal.make({
        columns: Effect.succeed(80),
        rows: Effect.succeed(24),
        readInput: Effect.succeed(input),
        readLine: Effect.die("unused"),
        display: () => Effect.void,
      });
      return yield* prompt.pipe(
        Effect.provideService(Terminal.Terminal, terminal),
      );
    }).pipe(Effect.provide(BunServices.layer)),
  );

const choices = [
  { title: "First", value: "first" },
  { title: "Second", value: "second" },
];
test("Escape returns without choosing a highlighted menu item", async () => {
  expect(
    await runKeys(select({ message: "Menu", choices }), ["down", "escape"]),
  ).toBeNull();
});
test("Escape cancels a confirmation even when Yes is highlighted", async () => {
  expect(
    await runKeys(confirm({ message: "Save?", initial: true }), ["escape"]),
  ).toBe(false);
});
test("Escape discards only an unfinished multi-selection", async () => {
  expect(
    await runKeys(multiSelect({ message: "Packages", choices }), [
      "space",
      "escape",
    ]),
  ).toEqual([]);
  expect(
    await runKeys(multiSelect({ message: "Packages", choices }), [
      "space",
      "enter",
    ]),
  ).toEqual(["first"]);
});
test("radio Escape cancels and Enter selects the active version", async () => {
  expect(
    await runKeys(radioSelect("Versions", choices, "second"), ["escape"]),
  ).toBeNull();
  expect(
    await runKeys(radioSelect("Versions", choices, "second"), ["enter"]),
  ).toBe("second");
});
test("an empty details prompt still goes back with Escape", async () => {
  expect(
    await runKeys(select({ message: "Release notes", choices: [] }), [
      "escape",
    ]),
  ).toBeNull();
});
