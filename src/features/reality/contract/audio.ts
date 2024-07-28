import { ArweaveTxId } from "@/features/arweave/lib/model";
import { z } from "zod";

export const TrackConfig = z.object({
  Type: z.enum(["Fixed"]),
  Format: z.enum(["WAV", "MP3", "OGG", "OPUS", "WEBM"]),
  TxId: ArweaveTxId,
});

export const AudioParams = z.object({
  Bgm: z.optional(TrackConfig),
});
export type AudioParams = z.infer<typeof AudioParams>;
