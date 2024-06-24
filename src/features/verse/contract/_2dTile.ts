import { ArweaveTxId } from "@/features/arweave/lib/model";
import { z } from "zod";
import { VerseVector } from "./model";

export const Vector2 = VerseVector.refine((position) => position.length === 2, {
  message: "Expected an array of length 2",
});
export type Vector2 = z.infer<typeof Vector2>;

export const Vector2Int = Vector2.refine(
  (position) => position.every((n) => Number.isInteger(n)),
  {
    message: "Expected integers",
  },
);
export type Vector2Int = z.infer<typeof Vector2Int>;

export const TilesetType = z.enum(["Fixed"]);
export type TilesetType = z.infer<typeof TilesetType>;

export const ImageFormat = z.enum(["PNG"]);
export type ImageFormat = z.infer<typeof ImageFormat>;

export const Tileset = z.object({
  Type: TilesetType,
  Format: ImageFormat,
  TxId: ArweaveTxId,
});
export type Tileset = z.infer<typeof Tileset>;

export const TilemapType = z.enum(["Fixed"]);
export type TilemapType = z.infer<typeof TilemapType>;

export const TilemapFormat = z.enum(["TMJ"]);
export type TilemapFormat = z.infer<typeof TilemapFormat>;

export const TilemapOffset = Vector2Int;
export type TilemapOffset = z.infer<typeof TilemapOffset>;

export const Tilemap = z.object({
  Type: TilemapType,
  Format: TilemapFormat,
  TxId: ArweaveTxId,
  Offset: z.optional(TilemapOffset),
});
export type Tilemap = z.infer<typeof Tilemap>;

export const Spawn = Vector2Int;
export type Spawn = z.infer<typeof Spawn>;

export const _2dTileParams = z.object({
  Version: z.number(),
  Spawn: z.optional(Spawn),
  Tileset,
  Tilemap,
});
export type _2dTileParams = z.infer<typeof _2dTileParams>;
