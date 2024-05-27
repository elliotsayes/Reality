import { z } from "zod";
import { _2dTile } from "./_2dTile";
import { ArweaveAddress } from "@/features/arweave/lib/model";

export const VerseInfo = z.object({
  Parent: z.string(),
  Name: z.string(),
  Dimensions: z.number(),
  'Render-With': z.string(),
});
export type VerseInfo = z.infer<typeof VerseInfo>;

export const VerseParameterBounds = z.object({
  Lower: z.array(z.number()),
  Upper: z.array(z.number()),
});

export const VerseParameters = z.object({
  Bounds: VerseParameterBounds,
  '2D-Tile-0': z.optional(_2dTile),
});
export type VerseParameters = z.infer<typeof VerseParameters>;

export const VerseEntityType = z.enum(["Avatar", "Warp"]);
export type VerseEntityType = z.infer<typeof VerseEntityType>;

export const VerseEntityPosition = z.array(z.number());
export type VerseEntityPosition = z.infer<typeof VerseEntityPosition>;

export const VerseEntities = z.record(
  ArweaveAddress,
  z.object({
    Type: VerseEntityType,
    Position: VerseEntityPosition,
  })
);
export type VerseEntities = z.infer<typeof VerseEntities>;

export const VerseEntity = VerseEntities.refine(
  (entities) => Object.keys(entities).length === 1,
  {
    message: "Expected exactly one entity",
  }
);
export type VerseEntity = z.infer<typeof VerseEntity>;
