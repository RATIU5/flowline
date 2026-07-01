import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { DatabaseClient, type DatabaseClientError } from "../client";

import type { InsertResult, UpdateResult } from "../../types/utils";

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
    }) => Effect.Effect<InsertResult, DatabaseClientError>;
  }
>()("@flowline/db/modules/channel/channel.repository/ChannelRepository") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = yield* DatabaseClient;
      return {
        create: ({ channelName, spaceId }) =>
          client
            .execute((db) =>
              db.insertInto("channel").values({
                name: channelName,
                id: "", // TODO: fill in with snowflake id
                position: 1, // TODO: read other channels, increment by 1
                spaceId,
              }),
            )
            .pipe(Effect.map((u) => u[0])),
      };
    }),
  );
}
