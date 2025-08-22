import type { FormConfig } from "@flowline/forms";

/**
 * A generic helper function to create a FormConfig with correct type inference.
 * This avoids TypeScript variance issues with the `validations` property.
 * @param config The form configuration.
 * @returns The same configuration, but correctly typed.
 */
export const createFormConfig = <T extends Record<string, unknown>>(
  config: FormConfig<T>
): FormConfig<T> => config;
