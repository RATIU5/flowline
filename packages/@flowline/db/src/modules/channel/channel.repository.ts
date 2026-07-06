import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as SnowFlake from "effect/unstable/cluster/Snowflake";

import { DatabaseClient, type DatabaseClientError } from "../client";
import { ChannelRepositoryError } from "./channel.errors";

import type { DB } from "../../types";
import type {
  InsertResult,
  UpdateResult,
  DeleteResult,
} from "../../types/utils";

type ChannelUpdateCols = Partial<
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

    delete: ({
      channelId,
    }: {
      channelId: string;
    }) => Effect.Effect<
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
      };
    }),
  );
}
