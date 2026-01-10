import { resolve } from "node:path";
import { config } from "dotenv";
import { PostgresDialect } from "kysely";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";

// Load .env from monorepo root (cwd is packages/@flowline/database)
config({ path: resolve(process.cwd(), "..", "..", "..", ".env") });

const { DATABASE_USER, DATABASE_PASSWORD, DATABASE_DB, DATABASE_PORT } =
  process.env;
const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@localhost:${DATABASE_PORT ?? 5432}/${DATABASE_DB}`;

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString }),
  }),
  migrations: {
    migrationFolder: "migrations",
  },
});
