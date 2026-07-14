import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as SnowFlake from "effect/unstable/cluster/Snowflake";

import { toPatch } from "../../utils";
import { DatabaseClient, type DatabaseClientError } from "../client";
import { ChannelRepositoryError } from "./channel.errors";

import type { DB, Nullable } from "../../types";
import type {
  InsertResult,
  UpdateResult,
  DeleteResult,
} from "../../types/utils";

type ChannelUpdateCols = Nullable<
  Omit<DB["channel"], "createdAt" | "id" | "spaceId">
>;

export class ChannelRepository extends Context.Service<
  ChannelRepository,
  {
    /*
     * Create a new space on the database
     */
    create: ({
      channelName,
      spaceId,
    }: {
      channelName: string;
      spaceId: string;
    }) => Effect.Effect<
      InsertResult,
      DatabaseClientError | ChannelRepositoryError
    >;

    update: (
      channelId: string,
      columns: ChannelUpdateCols,
    ) => Effect.Effect<
      UpdateResult,
      DatabaseClientError | ChannelRepositoryError
    >;

    delete: (
      channelId: string,
    ) => Effect.Effect<
      DeleteResult,
      DatabaseClientError | ChannelRepositoryError
    >;
  }
>()("@flowline/db/modules/channel/channel.repository/ChannelRepository") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = yield* DatabaseClient;
      const snowflake = yield* SnowFlake.Generator;
      return {
        create: ({ channelName, spaceId }) =>
          Effect.gen(function* () {
            const maxChannels = yield* client.execute((db) =>
              db
                .selectFrom("channel")
                .select("position")
                .where("spaceId", "=", spaceId),
            );

            let channelPosition = 0;
            if (maxChannels?.length > 0) {
              // oxlint-disable-next-line typescript/no-non-null-assertion
              const maxChannel = maxChannels.at(-1)!;
              channelPosition = maxChannel.position + 1;
            }

            const insertResult = yield* client.execute((db) =>
              db.insertInto("channel").values({
                id: snowflake.nextUnsafe(),
                name: channelName,
                position: channelPosition,
                spaceId,
              }),
            );

            if (insertResult.length === 0) {
              return yield* new ChannelRepositoryError({
                function: "create",
                name: "NoInsertRows",
                message: "Failed to insert new channel row",
              });
            } else if (insertResult.length > 1) {
              return yield* new ChannelRepositoryError({
                function: "create",
                name: "TooManyInsertRows",
                message: "Too many rows returned from channel insert",
              });
            }

            return insertResult;
          }).pipe(Effect.map((r) => r[0])),

        update: (channelId, columns) =>
          Effect.gen(function* () {
            const updateResult = yield* client.execute((db) =>
              db
                .updateTable("channel")
                .set(toPatch(columns))
                .where("id", "=", channelId),
            );

            if (updateResult.length === 0) {
              return yield* new ChannelRepositoryError({
                function: "update",
                name: "NoUpdateRows",
                message: "Failed to update channel row",
              });
            } else if (updateResult.length > 1) {
              return yield* new ChannelRepositoryError({
                function: "update",
                name: "TooManyUpdateRows",
                message: "Too many rows returned from channel update",
              });
            }

            return updateResult;
          }).pipe(Effect.map((r) => r[0])),

        delete: (channelId) =>
          Effect.gen(function* () {
            const deleteResult = yield* client.execute((db) =>
              db.deleteFrom("channel").where("id", "=", channelId),
            );

            if (deleteResult.length === 0) {
              return yield* new ChannelRepositoryError({
                function: "delete",
                name: "NoDeleteRows",
                message: "Failed to delete channel row",
              });
            } else if (deleteResult.length > 1) {
              return yield* new ChannelRepositoryError({
                function: "delete",
                name: "TooManyDeleteRows",
                message: "Too many rows returned from channel delete",
              });
            }

            return deleteResult;
          }).pipe(Effect.map((r) => r[0])),
      };
    }),
  );
}
