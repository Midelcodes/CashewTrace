import { z } from "zod";

// Shared shape for useActionState-driven forms: a top-level error/warning plus per-field messages.
export type FormState = {
  error?: string;
  warning?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export function fieldErrors(error: z.ZodError): FormState["fieldErrors"] {
  return z.flattenError(error).fieldErrors as FormState["fieldErrors"];
}

/** Plain string fields from a FormData, minus React's internal $ACTION_* entries - echoed back on errors. */
export function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData].filter(([k, v]) => !k.startsWith("$") && typeof v === "string"),
  ) as Record<string, string>;
}
