import { z } from "zod";
import { _2dTileParams } from "./_2dTile";
import { ArweaveAddress } from "@/features/arweave/lib/model";

export const VerseVector = z.array(z.number());
export type VerseVector = z.infer<typeof VerseVector>;

export const VerseInfo = z.object({
  Parent: z.string(),
  Name: z.string(),
  Dimensions: z.number(),
  "Render-With": z.string(),
});
export type VerseInfo = z.infer<typeof VerseInfo>;

export const VerseParameterBounds = z.object({
  Lower: z.array(z.number()),
  Upper: z.array(z.number()),
});

export const VerseParameters = z.object({
  Bounds: z.optional(VerseParameterBounds),
  "2D-Tile-0": z.optional(_2dTileParams),
});
export type VerseParameters = z.infer<typeof VerseParameters>;

export const VerseEntityType = z.enum(["Unknown", "Avatar", "Hidden"]);
export type VerseEntityType = z.infer<typeof VerseEntityType>;

export const VerseEntityPosition = VerseVector;
export type VerseEntityPosition = z.infer<typeof VerseEntityPosition>;

export const DefaultInteraction = z.object({
  Type: z.literal("Default"),
});
export type DefaultInteraction = z.infer<typeof DefaultInteraction>;

export const Warp = z.object({
  Type: z.literal("Warp"),
  Size: z.optional(z.array(z.number())),
});
export type Warp = z.infer<typeof Warp>;

export const SchemaForm = z.object({
  Type: z.literal("SchemaForm"),
  Id: z.string(),
});
export type SchemaForm = z.infer<typeof SchemaForm>;

export const SchemaExternalForm = z.object({
  Type: z.literal("SchemaExternalForm"),
  Id: z.string(),
});
export type SchemaExternalForm = z.infer<typeof SchemaForm>;

export const VerseEntityMetadata = z.intersection(
  z.object({
    Interaction: z.optional(
      z.discriminatedUnion("Type", [
        DefaultInteraction,
        Warp,
        SchemaForm,
        SchemaExternalForm,
      ]),
    ),
    ProfileId: z.optional(z.string()),
    DisplayName: z.optional(z.string()),
  }),
  z.record(z.string(), z.any()),
);
export type VerseEntityMetadata = z.infer<typeof VerseEntityMetadata>;

export const VerseEntity = z.object({
  Position: VerseEntityPosition,
  Type: VerseEntityType,
  Metadata: z.optional(VerseEntityMetadata),
  StateCode: z.optional(z.number()),
});
export type VerseEntity = z.infer<typeof VerseEntity>;

export const VerseEntityCreate = z.object({
  Type: z.optional(VerseEntityType),
  Position: z.optional(VerseEntityPosition),
  Metadata: z.optional(VerseEntityMetadata),
});
export type VerseEntityCreate = z.infer<typeof VerseEntityCreate>;

export const VerseEntities = z.record(ArweaveAddress, VerseEntity);
export type VerseEntities = z.infer<typeof VerseEntities>;

export const VerseEntityKeyed = VerseEntities.refine(
  (entities) => Object.keys(entities).length === 1,
  {
    message: "Expected exactly one entity",
  },
);
export type VerseEntityKeyed = z.infer<typeof VerseEntityKeyed>;
