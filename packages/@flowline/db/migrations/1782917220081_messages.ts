// oxlint-disable typescript/no-explicit-any
// oxlint-disable max-lines-per-function
import { type Kysely, sql } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType("message_type")
    .asEnum(["DEFAULT", "REFERENCE", "SYSTEM", "THREAD_STARTER"])
    .execute();

  await db.schema
    .createTable("space")
    .addColumn("id", "uuid", (col) =>
      col
        .primaryKey()
        .notNull()
        .defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("ownerId", "text", (col) =>
      col.notNull().references("user.id").onDelete("restrict"),
    )
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable("channel")
    .addColumn("id", "bigint", (col) => col.primaryKey().notNull())
    .addColumn("spaceId", "uuid", (col) =>
      col.notNull().references("space.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("position", "int4", (col) => col.notNull())
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable("message")
    .addColumn("id", "bigint", (col) => col.primaryKey().notNull())
    .addColumn("channelId", "bigint", (col) =>
      col.notNull().references("channel.id").onDelete("cascade"),
    )
    .addColumn("userId", "text", (col) =>
      col.references("user.id").onDelete("set null"),
    )
    .addColumn("referenceId", "bigint", (col) =>
      col.references("message.id").onDelete("set null"),
    )
    .addColumn("type", sql`message_type`, (col) => col.notNull())
    .addColumn("content", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("pinned", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("isDeletable", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("editedAt", "timestamptz")
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("message").execute();
  await db.schema.dropTable("channel").execute();
  await db.schema.dropTable("space").execute();
  await db.schema.dropType("message_type").execute();
}
