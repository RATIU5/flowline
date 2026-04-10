import { MessageRpcs } from "@flowline/rpc/message";
import * as Layer from "effect/Layer";
import { RpcServer } from "effect/unstable/rpc";
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization";

import { MessageHandlers } from "./messages.handlers";
import { ChatPubSub } from "./messages.service";

export const MessagesRoute = RpcServer.layerHttp({
  group: MessageRpcs,
  path: "/rpc",
  protocol: "websocket",
}).pipe(
  Layer.provide(MessageHandlers),
  Layer.provide(ChatPubSub.layer),
  Layer.provide(RpcSerialization.layerJson),
);
