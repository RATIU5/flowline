import { Effect } from "effect";
import { runExample } from "./simple-string-form";

Effect.runPromise(runExample()).then(() => console.log("Form example completed"));
