import type {
  Selectable as k_Selectable,
  InsertResult as k_InsertResult,
  UpdateResult as k_UpdateResult,
  DeleteResult as k_DeleteResult,
} from "kysely";

export type Selectable<T> = k_Selectable<T>;
export type InsertResult = k_InsertResult;
export type UpdateResult = k_UpdateResult;
export type DeleteResult = k_DeleteResult;
