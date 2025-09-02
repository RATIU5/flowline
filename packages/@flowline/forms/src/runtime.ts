import type { Atom } from "@effect-atom/atom";
import { Context } from "effect";

export class FormRuntime extends Context.Tag("@flowline/forms/runtime/FormRuntime")<FormRuntime, Atom.AtomRuntime<never, never>>() { }
