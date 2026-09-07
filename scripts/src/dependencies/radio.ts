import { radio } from "./navigation";

export const radioSelect = (
  message: string,
  choices: readonly { title: string; value: string }[],
  initial?: string,
) =>
  radio({
    message,
    choices: choices.map((choice) => ({
      ...choice,
      selected: choice.value === initial,
    })),
  });
