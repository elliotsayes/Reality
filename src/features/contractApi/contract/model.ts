// Placeholder
// TODO: Define this properly
import { RJSFSchema } from '@rjsf/utils';
import { z } from 'zod';

export const ApiSchemaMethod = z.object({
  Title: z.string(),
  Description: z.string(),
  Schema: z.object({
    Tags: z.custom<RJSFSchema>(),
  }),
});
export type ApiSchemaMethod = z.infer<typeof ApiSchemaMethod>;

export const ApiSchema = z.record(ApiSchemaMethod);
export type ApiSchema = z.infer<typeof ApiSchema>;
