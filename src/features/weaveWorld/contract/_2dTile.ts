import { ArweaveTxId } from "@/features/arweave/lib/model";
import { z } from "zod";

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

export const TilemapType = z.enum(["Fixed"])
export type TilemapType = z.infer<typeof TilemapType>

export const TilemapFormat = z.enum(["TMJ"])
export type TilemapFormat = z.infer<typeof TilemapFormat>

export const Tilemap = z.object({
  Type: TilemapType,
  Format: TilemapFormat,
  TxId: ArweaveTxId,
});
export type Tilemap = z.infer<typeof Tilemap>;

export const _2dTile = z.object({
  Version: z.number(),
  Tileset,
  Tilemap,
});
export type _2dTile = z.infer<typeof _2dTile>;
