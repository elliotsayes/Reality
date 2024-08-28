import { ArweaveId } from "@/features/arweave/lib/model";
import { z } from "zod";

export const ProfileEntry = z.object({
  CallerAddress: ArweaveId,
  ProfileId: ArweaveId,
});
export type ProfileEntry = z.infer<typeof ProfileEntry>;

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

// Define the Asset schema
export const Asset = z.object({
  Quantity: z.string(),
  Id: z.string(),
});
export type Asset = z.infer<typeof Asset>;

// Define the DetailedAsset schema with an optional icon
export const DetailedAsset = z.object({
  asset: Asset,
  icon: z.string(), // Making icon optional
});
export type DetailedAsset = z.infer<typeof DetailedAsset>;

// Define the ProfileAssets schema as an array of DetailedAssets
export const ProfileAssets = z.array(DetailedAsset);
export type ProfileAssets = z.infer<typeof ProfileAssets>;