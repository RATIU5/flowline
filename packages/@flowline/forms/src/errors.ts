import { ParseResult } from "effect";

export const GlobalErrorKey = Symbol.for("@flowline/forms/GlobalErrorKey");

type FormattedErrors = ReadonlyMap<string | symbol, ReadonlyArray<string>>;

/**
 * Formats a ParseResult.ParseError into a map of field paths to error messages.
 * Uses Effect's ArrayFormatter for robust, maintainable error parsing.
 *
 * @param error The ParseResult.ParseError to format
 * @returns Effect that produces a map where keys are field paths (or GlobalErrorKey for global errors)
 *          and values are arrays of error messages for that field
 */
export const formatErrors = (
  error: ParseResult.ParseError,
): FormattedErrors => {
  const formatterIssues = ParseResult.ArrayFormatter.formatErrorSync(error);
  const errorMap = new Map<string | symbol, string[]>();
  for (const issue of formatterIssues) {
    const pathKey =
      issue.path.length === 0 ? GlobalErrorKey : issue.path.join(".");
    const existingMessages = errorMap.get(pathKey) ?? [];
    errorMap.set(pathKey, [...existingMessages, issue.message]);
  }
  return new Map(
    Array.from(errorMap.entries()).map(
      ([key, messages]) => [key, messages as ReadonlyArray<string>] as const,
    ),
  ) as FormattedErrors;
};
