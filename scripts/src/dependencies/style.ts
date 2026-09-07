/** Small terminal palette. Labels remain readable without color. */
const codes = {
  bold: 1,
  muted: 90,
  accent: 36,
  good: 32,
  warning: 33,
  error: 31,
  inverse: 7,
  normal: 0,
};
export const paint = (tone: keyof typeof codes, text: string): string =>
  process.stdout.isTTY &&
  process.env.NO_COLOR === undefined &&
  process.env.TERM !== "dumb"
    ? `\x1b[${codes[tone]}m${text}\x1b[0m`
    : text;

export const plain = (text: string): string =>
  text
    .replaceAll("→", "->")
    .replaceAll("·", "/")
    .replaceAll("—", "-")
    .replace(/[^\x20-\x7e]/g, " ");

export const rule = (): string =>
  paint(
    "muted",
    "─".repeat(Math.max(8, Math.min(64, (process.stdout.columns || 80) - 2))),
  );
