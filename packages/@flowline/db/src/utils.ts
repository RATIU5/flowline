/**
 * Process columns (records) and format them to Kysely.
 *
 * Note: `null` values are converted to undefined values for Kysely, while
 * `undefined` values are omitted from the returned record.
 *
 * @param cols the columns to patch in record format
 * @returns the Kysely-ready columns
 */
export const toPatch = <T extends object>(cols: T) => {
  const out: { [K in keyof T]?: Exclude<T[K], null> } = {};
  for (const k in cols) {
    const v = cols[k];
    if (v === null) {
      out[k] = undefined;
    } else if (v !== undefined) {
      // SAFETY: `v` is `cols[k]` with both `null` and `undefined` ruled out above.
      out[k] = v as Exclude<T[typeof k], null>;
    }
  }
  return out;
};
