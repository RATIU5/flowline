/**
 * Process columns (records) and format them to Kysely.
 *
 * Note: `null` values are converted to undefined values for Kysely, while
 * `undefined` values are omitted from the returned record.
 *
 * @param cols the columns to patch in record format
 * @returns the Kysely-ready columns
 */
export const toPatch = <T extends Record<string, unknown>>(
  cols: T,
): { [K in keyof T]?: Exclude<T[K], null> } => {
  const out = {} as { [K in keyof T]?: Exclude<T[K], null> };
  for (const k of Object.keys(cols) as Array<keyof T>) {
    const v = cols[k];
    if (v === null) {
      out[k] = undefined;
    } else if (v !== undefined) {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      out[k] = v as Exclude<T[typeof k], null>;
    }
  }
  return out;
};
