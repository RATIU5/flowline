import { betterAuth } from "better-auth";
import { BunDialect } from "@ratiu5/kysely-bun-psql";

const dialect = new BunDialect({
  url: process.env.DATABASE_URL ?? "postgres://postgres@localhost:5434/test",
});

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  database: {
    dialect,
    type: "postgres",
  },
});
