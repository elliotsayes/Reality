import { ArweaveId } from "@/features/arweave/lib/model";
import { z } from "zod";

export const ProfileInfo = z.object({
  ProfileId: ArweaveId,
  Username: z.string(),
  ProfileImage: z.string(),
  CoverImage: z.string(),
  Description: z.string(),
  DisplayName: z.string(),
});
export type ProfileInfo = z.infer<typeof ProfileInfo>;

export const ProfileInfoCreate = ProfileInfo.omit({
  ProfileId: true,
  Username: true,
})
  .extend({
    UserName: z.string(),
    DateCreated: z.number(),
    DateUpdated: z.number(),
  })
  .partial({
    // Username: true,
    // ProfileImage: true,
    // CoverImage: true,
    // Description: true,
    // DisplayName: true,
  });
export type ProfileInfoCreate = z.infer<typeof ProfileInfoCreate>;

export const ProfileInfoUpdate = ProfileInfoCreate.omit({
  DateCreated: true,
}).partial();
export type ProfileInfoUpdate = z.infer<typeof ProfileInfoUpdate>;
