export const objectKeys = <T extends object>(
  obj: T,
): Extract<keyof T, string>[] =>
  Object.keys(obj).filter((k): k is Extract<keyof T, string> => k in obj);
