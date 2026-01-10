import { PgClient } from "@effect/sql-pg";
import { Config } from "effect";

export const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
});
