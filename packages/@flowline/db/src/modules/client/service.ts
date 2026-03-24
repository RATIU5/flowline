import * as ServiceMap from "effect/ServiceMap";

export class DatabaseClient extends ServiceMap.Service<
  DatabaseClient,
  {
    readonly connect: () => Promise<void>;
    readonly query: () => void;
    readonly disconnect: () => void;
    readonly transaction: () => void;
  }
>()("@flowline/db/client/DatabaseClient") {}
