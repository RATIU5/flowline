import { Effect, pipe, Schema } from "effect";
import { createForm } from "@flowline/forms";
import { bindForm, runForm } from "@flowline/forms-vanilla";

const FormSchema = Schema.Struct({
  firstName: pipe(
    Schema.NonEmptyString,
  ),
  lastName: pipe(
    Schema.NonEmptyString,
  ),
  email: pipe(
    Schema.NonEmptyString,
  ),
  age: pipe(
    Schema.Number,
  ),
  country: pipe(
    Schema.NonEmptyString,
  ),
  newsletter: pipe(
    Schema.Boolean,
  ),
  password: pipe(
    Schema.NonEmptyString,
    Schema.minLength(8),
  ),
});

const formProgram = Effect.gen(function* () {
  const formEl = document.querySelector(
    "form#user-form",
  ) as HTMLFormElement | null;
  if (!formEl) return;

  const form = yield* createForm({
    schema: FormSchema,
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      age: 0,
      country: "",
      newsletter: false,
      password: "",
    },
  });

  yield* bindForm({
    form,
    element: formEl,
    onSubmit: (data) =>
      Effect.sync(() => {
        console.log("Form submitted:", data);
      }),
  });
});

document.addEventListener("DOMContentLoaded", () => {
  Effect.runPromise(runForm(formProgram));
});
