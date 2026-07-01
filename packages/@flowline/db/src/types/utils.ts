import type {
  Selectable as k_Selectable,
  InsertResult as k_InsertResult,
  UpdateResult as k_UpdateResult,
} from "kysely";

export type Selectable<T> = k_Selectable<T>;
export type InsertResult = k_InsertResult;
export type UpdateResult = k_UpdateResult;
