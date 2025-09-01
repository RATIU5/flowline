import { Effect, pipe, Schema } from "effect";
import { createForm } from "@flowline/forms";
import { bindForm, runForm } from "@flowline/forms-vanilla";

const FormSchema = Schema.Struct({
  firstName: pipe(
    Schema.NonEmptyString,
    Schema.annotations({
      label: "First Name",
      placeholder: "Enter your first name",
    }),
  ),
  lastName: pipe(
    Schema.NonEmptyString,
    Schema.annotations({
      label: "Last Name",
      placeholder: "Enter your last name",
    }),
  ),
});

const formProgram = Effect.gen(function* () {
  const formEl = document.querySelector(
    "form#user-form",
  ) as HTMLFormElement | null;
  console.log("test");
  if (!formEl) return;

  const form = yield* createForm({
    schema: FormSchema,
    initialValues: {
      firstName: "",
      lastName: "",
    },
  });

  yield* bindForm({
    form,
    element: formEl,
    onSubmit: (data) => Effect.sync(() => {
      console.log("Form submitted:", data);
    }),
  });
});

document.addEventListener("DOMContentLoaded", () => {
  Effect.runPromise(runForm(formProgram));
});
