// oxlint-disable typescript/no-explicit-any
import { type Kysely, sql } from "kysely";

/**
 * better-auth 1.7 added the required `account.issuer` column and made
 * (issuer, accountId) the unique account key.
 *
 * Existing rows are backfilled with the synthetic issuer better-auth would
 * have written: `local:<providerId>` for credential accounts and
 * `local:oauth:<providerId>` for everything else.
 */
export const up = async (db: Kysely<any>): Promise<void> => {
  await db.schema.alterTable("account").addColumn("issuer", "text").execute();

  await sql`
    update "account"
    set "issuer" = case
      when "providerId" = 'credential' then 'local:credential'
      else 'local:oauth:' || "providerId"
    end
    where "issuer" is null
  `.execute(db);

  await db.schema
    .alterTable("account")
    .alterColumn("issuer", (col) => col.setNotNull())
    .execute();

  await db.schema
    .createIndex("account_issuer_accountId_idx")
    .on("account")
    .columns(["issuer", "accountId"])
    .unique()
    .execute();
  return void 0;
};

export const down = async (db: Kysely<any>): Promise<void> => {
  await db.schema.dropIndex("account_issuer_accountId_idx").execute();
  await db.schema.alterTable("account").dropColumn("issuer").execute();
  return void 0;
};
