import {
	Context,
	Effect,
	FiberId,
	FiberRef,
	FiberRefs,
	Logger,
	Option,
} from "effect";

export class LogOptions extends Context.Tag("LogOptions")<
	LogOptions,
	{
		style: "basic" | "debug" | "none";
	}
>() {}

export const BunLogger = Effect.gen(function* () {
	return Logger.make((_) => {
		const currentStyle = FiberRefs.get(_.context, FiberRef.currentContext).pipe(
			Option.flatMap((_) => Context.getOption(_, LogOptions)),
			Option.map((_) => _.style),
			Option.getOrElse(() => "none"),
		);
		const id = FiberId.threadName(_.fiberId);
		switch (currentStyle) {
			case "debug": {
				const parts = [
					`[${new Date(_.date).toISOString()}]`,
					`[${_.logLevel.label}]`,
					`[${id}]`,
					_.message,
				];
				const structured = Object.entries(_.annotations)
					.filter(([key]) => !key.startsWith("_") && key !== "style")
					.map(([key, value]) => `${key}=${value}`)
					.join(" ");
				const logOutput = `${parts.join(" ")}${structured ? ` ${structured}` : ""}\n`;
				Bun.stdout.write(logOutput);
				break;
			}
			case "basic": {
				const parts = [`[${_.logLevel.label}]`, _.message];
				const structured = Object.entries(_.annotations)
					.filter(([key]) => !key.startsWith("_") && key !== "style")
					.map(([key, value]) => `${key}=${value}`)
					.join(" ");
				const logOutput = `${parts.join(" ")}${structured ? ` ${structured}` : ""}\n`;
				Bun.stdout.write(logOutput);
				break;
			}
			default:
				Bun.stdout.write(String(_.message));
		}
	});
});
