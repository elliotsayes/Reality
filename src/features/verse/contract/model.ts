import { z } from "zod";
import { _2dTile } from "./_2dTile";
import { ArweaveAddress } from "@/features/arweave/lib/model";

export const WorldInfo = z.object({
  Parent: z.string(),
  Name: z.string(),
  Dimensions: z.number(),
  'Render-With': z.string(),
});
export type WorldInfo = z.infer<typeof WorldInfo>;

export const WorldParameterBounds = z.object({
  Lower: z.array(z.number()),
  Upper: z.array(z.number()),
});

export const WorldParameters = z.object({
  Bounds: WorldParameterBounds,
  '2D-Tile-0': z.optional(_2dTile),
});
export type WorldParameters = z.infer<typeof WorldParameters>;

export const WorldEntityType = z.enum(["Avatar", "Warp"]);
export type WorldEntityType = z.infer<typeof WorldEntityType>;

export const WorldEntityPosition = z.array(z.number());
export type WorldEntityPosition = z.infer<typeof WorldEntityPosition>;

export const WorldEntities = z.record(
  ArweaveAddress,
  z.object({
    Type: WorldEntityType,
    Position: WorldEntityPosition,
  })
);
export type WorldEntities = z.infer<typeof WorldEntities>;

export const WorldEntity = WorldEntities.refine(
  (entities) => Object.keys(entities).length === 1,
  {
    message: "Expected exactly one entity",
  }
);
export type WorldEntity = z.infer<typeof WorldEntity>;
