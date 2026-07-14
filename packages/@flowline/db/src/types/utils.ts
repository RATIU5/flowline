import type {
  Selectable as k_Selectable,
  InsertResult as k_InsertResult,
  UpdateResult as k_UpdateResult,
  DeleteResult as k_DeleteResult,
  SelectExpression as k_SelectExpression,
} from "kysely";

export type Selectable<T> = k_Selectable<T>;
export type InsertResult = k_InsertResult;
export type UpdateResult = k_UpdateResult;
export type DeleteResult = k_DeleteResult;
export type SelectExpression<T, K extends keyof T> = k_SelectExpression<T, K>;

export type Nullable<T> = {
  [K in keyof T]?: T[K] | null;
};
