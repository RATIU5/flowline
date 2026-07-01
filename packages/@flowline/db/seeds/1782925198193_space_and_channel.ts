// oxlint-disable typescript/no-explicit-any
// oxlint-disable max-lines-per-function
import type { Kysely } from "kysely";

import type { DB } from "../src/types";

// replace `any` with your database interface.
export async function seed(db: Kysely<DB>): Promise<void> {
  // @ts-ignore
  const seedEmail = process.env.SEED_USER_EMAIL ?? "";

  if (seedEmail === "") {
    console.log("Error: SEED_USER_EMAIL was not found in env");
    return;
  }

  const rows = await db
    .selectFrom("user")
    .select("id")
    .where("email", "=", seedEmail)
    .execute();

  if (rows.length === 0) {
    console.log("Error: SEED_USER_EMAIL env value not found in database");
  }

  db.insertInto("space").values({
    name: "Test",
    ownerId: rows[0].id,
  });
}
