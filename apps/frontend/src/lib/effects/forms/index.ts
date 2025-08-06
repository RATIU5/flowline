import { Context, Layer, Option, type Schema } from "effect";
import type { SvelteComponent } from "svelte";

export const NoDefaultValue = Symbol.for("FormField/NoDefaultValue");
export type NoDefaultValueType = typeof NoDefaultValue;

class FormFieldClass<
  Self,
  A extends SvelteComponent,
  S extends Schema.Schema.AnyNoContext,
> {
  private constructor(
    readonly tag: Context.Tag<Self, ComponentBuilder<A>>,
    readonly schema: S,
    readonly defaultValue: S["Encoded"] | NoDefaultValueType,
  ) {}

  static withDefaultValue = <
    Self,
    A extends SvelteComponent,
    S extends Schema.Schema.AnyNoContext,
  >(
    tag: Context.Tag<Self, ComponentBuilder<A>>,
    schema: S,
    defaultValue: S["Encoded"],
  ) => new FormFieldClass(tag, schema, defaultValue);

  static withoutDefaultValue = <
    Self,
    A extends SvelteComponent,
    S extends Schema.Schema.AnyNoContext,
  >(
    tag: Context.Tag<Self, ComponentBuilder<A>>,
    schema: S,
  ) => new FormFieldClass(tag, schema, NoDefaultValue);

  decorate<A_ extends A>(): FormFieldClass<Self, A_, S> {
    // @ts-expect-error: "casting this to another SvelteComponent type"
    return this;
  }

  getDefaultValue(): Option.Option<S["Encoded"]> {
    return Option.liftPredicate(
      this.defaultValue,
      (value) => value !== NoDefaultValue,
    );
  }

  matchDefaultValue({
    withDefaultValue,
    withoutDefaultValue,
  }: {
    withDefaultValue: (value: S["Encoded"]) => void;
    withoutDefaultValue: () => void;
  }): void {
    if (this.defaultValue === NoDefaultValue) {
      withoutDefaultValue?.();
    } else {
      withDefaultValue(this.defaultValue);
    }
  }
}

type ComponentBuilder<A extends SvelteComponent> = (_: { path: Path }) => A;

export const FormField =
  <const Id extends string>(id: Id) =>
  <
    Self,
    A extends SvelteComponent,
    S_ extends Schema.Schema.AnyNoContext,
  >() => {
    const tag = Context.Tag<Id>(id)<Self, ComponentBuilder<A>>();
    return Object.assign(tag, {
      make: <S extends S_>(props: {
        schema: S;
        defaultValue: S["Encoded"];
      }): FormFieldClass<Self, A, S> =>
        FormFieldClass.withDefaultValue(tag, props.schema, props.defaultValue),
      makeRequired: <S extends S_>(props: {
        schema: S;
      }): FormFieldClass<Self, A, S> =>
        FormFieldClass.withoutDefaultValue<Self, A, S>(
          tag,
          // @ts-expect-error: "schema.annotations looses the type"
          props.schema.annotations({
            message: () => ({
              message: "This field is required",
              override: true,
            }),
          }),
        ),
      layerUncontrolled: (component: A) => Layer.effect(tag, FormFramework),
    });
  };
