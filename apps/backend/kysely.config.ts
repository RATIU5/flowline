import { BunDialect } from "@ratiu5/kysely-bun-psql";
import { defineConfig, getKnexTimestampPrefix } from "kysely-ctl";

export default defineConfig({
  dialect: new BunDialect({
    url: process.env.DATABASE_URL ?? "postgres://postgres@localhost:5434/test",
  }),
  migrations: {
    migrationFolder: "migrations",
    getMigrationPrefix: getKnexTimestampPrefix,
  },
  seeds: {
    seedFolder: "seeds",
  },
});
