// Placeholder
// TODO: Define this properly
import { ArweaveId } from "@/features/arweave/lib/model";
import { RJSFSchema } from "@rjsf/utils";
import { z } from "zod";

export const SchemaMethod = z.object({
  Title: z.string(),
  Description: z.string(),
  Schema: z.optional(
    z.object({
      Tags: z.custom<RJSFSchema>(),
    }),
  ),
  NoSubmit: z.optional(z.boolean()),
});
export type SchemaMethod = z.infer<typeof SchemaMethod>;

export const Schema = z.record(SchemaMethod);
export type Schema = z.infer<typeof Schema>;

export const SchemaExternalMethod = SchemaMethod.and(
  z.object({
    Target: ArweaveId,
  }),
);
export type SchemaExternalMethod = z.infer<typeof SchemaExternalMethod>;

export const SchemaExternal = z.record(SchemaExternalMethod);
export type SchemaExternal = z.infer<typeof SchemaExternal>;
