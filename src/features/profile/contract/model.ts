import { z } from "zod";

// Placeholder
// TODO: Define this properly
export const ProfileInfo = z.object({
  Name: z.string(),
  Description: z.string(),
  Avatar: z.string(),
});
export type ProfileInfo = z.infer<typeof ProfileInfo>;

// Placeholder
// TODO: Define this properly
export const ProfileInfoWritable = ProfileInfo;
export type ProfileInfoWritable = ProfileInfo;
