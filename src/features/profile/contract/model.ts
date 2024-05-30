import { ArweaveId } from "@/features/arweave/lib/model";
import { z } from "zod";

// Placeholder
// TODO: Define this properly
export const ProfileInfo = z.object({
  Created: z.number(),
  LastSeen: z.number(),
  Name: z.string(),
  Following: z.record(ArweaveId),
  AvatarSeed: z.optional(z.string()),
  Status: z.optional(z.string()),
  CurrentWorldId: z.optional(ArweaveId),
});
export type ProfileInfo = z.infer<typeof ProfileInfo>;

export const ProfileInfoKeyed = z.record(
  ArweaveId,
  ProfileInfo,
);
export type ProfileInfoKeyed = z.infer<typeof ProfileInfoKeyed>;

export const ProfileInfoCreate = ProfileInfo.omit({
  Created: true,
  LastSeen: true,
  Following: true,
});
export type ProfileInfoCreate = z.infer<typeof ProfileInfoCreate>;

export const ProfileInfoUpdate = ProfileInfoCreate.partial();
export type ProfileInfoUpdate = z.infer<typeof ProfileInfoUpdate>;
