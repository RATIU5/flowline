import {
  Context,
  Effect,
  FiberId,
  FiberRef,
  FiberRefs,
  HashMap,
  Logger,
  Option,
} from "effect";
import {
  blue,
  bold,
  cyan,
  dim,
  green,
  magenta,
  red,
  yellow,
} from "kleur/colors";

export class LogOptions extends Context.Tag("LogOptions")<
  LogOptions,
  {
    style: "basic" | "debug" | "raw";
  }
>() {}

const serialize = (value: unknown): string => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    typeof value === "symbol" ||
    value == null
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `${value.map(serialize).join(" ")}`;
  }
  // TODO: Rewrite with a better serializer to avoid try/catch
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
};

const formatAnnotations = (annotations: HashMap.HashMap<string, unknown>) =>
  Array.from(HashMap.entries(annotations))
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => `${key}=${serialize(value)}`)
    .join(" ");

export const BunLogger = Effect.gen(function* () {
  return Logger.make((_) => {
    const currentStyle = FiberRefs.get(_.context, FiberRef.currentContext).pipe(
      Option.flatMap((_) => Context.getOption(_, LogOptions)),
      Option.map((_) => _.style),
      Option.getOrElse(() => "raw"),
    );
    const message = serialize(_.message);

    let level = "";
    switch (_.logLevel.label) {
      case "ALL":
        level = `${dim("[")}${cyan(_.logLevel.label)}${dim("]")}`;
        break;
      case "TRACE":
        level = `${dim("[")}${magenta(_.logLevel.label)}${dim("]")}`;
        break;
      case "DEBUG":
        level = `${dim("[")}${green(_.logLevel.label)}${dim("]")}`;
        break;
      case "INFO":
        level = `${dim("[")}${blue(_.logLevel.label)}${dim("]")}`;
        break;
      case "WARN":
        level = `${dim("[")}${yellow(_.logLevel.label)}${dim("]")}`;
        break;
      case "ERROR":
        level = `${dim("[")}${red(_.logLevel.label)}${dim("]")}`;
        break;
      case "FATAL":
        level = `${dim("[")}${bold(red(_.logLevel.label))}${dim("]")}`;
        break;
      default:
        break;
    }

    switch (currentStyle) {
      case "debug": {
        const parts = [
          dim(`[${new Date(_.date).toISOString()}]`),
          level,
          `${dim("[")}${yellow(FiberId.threadName(_.fiberId))}${dim("]")}`,
          message,
        ];
        const structured = formatAnnotations(_.annotations);
        const logOutput = `${parts.join(" ")}${structured !== "" ? ` ${structured}` : ""}\n`;
        Bun.stdout.write(logOutput);
        break;
      }
      case "basic": {
        const parts = [level, message];
        const structured = formatAnnotations(_.annotations);
        const logOutput = `${parts.join(" ")}${structured !== "" ? ` ${structured}` : ""}\n`;
        Bun.stdout.write(logOutput);
        break;
      }
      default: {
        const structured = formatAnnotations(_.annotations);
        Bun.stdout.write(
          `${message}${structured !== "" ? ` ${structured}` : ""}\n`,
        );
      }
    }
  });
});
