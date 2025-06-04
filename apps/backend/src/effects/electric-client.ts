import { Effect } from "effect/index";
import { ELECTRICSQL_URL } from "../utils";
import {
  type GetExtensions,
  type Row,
  Shape,
  ShapeStream,
  type ShapeStreamOptions,
} from "@electric-sql/client/*";

export const shapeStream = <T extends Row<unknown> = Row>(
  params: Omit<ShapeStreamOptions<GetExtensions<T>>, "url">,
) =>
  Effect.sync(() => {
    const stream = new ShapeStream<T>({
      url: `${ELECTRICSQL_URL}/v1/shape`,
      ...params,
    });
    return stream;
  });

export const shape = <T extends Row<unknown> = Row>(stream: ShapeStream<T>) =>
  Effect.succeed(() => new Shape(stream));
