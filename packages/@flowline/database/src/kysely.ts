import * as Pg from "@effect/sql-kysely/Pg";
import { Effect } from "effect";
import type { DB } from "./types.js";

export class KyselyDB extends Effect.Service<KyselyDB>()("KyselyDB", {
  effect: Pg.make<DB>(),
}) {}
