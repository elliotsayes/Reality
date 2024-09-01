import { ArweaveId } from "@/features/arweave/lib/model";
import { z } from "zod";

export const TokenInfo = z.object({
  Name: z.string(),
  Ticker: z.string(),
  Logo: z.optional(ArweaveId),
  Denomination: z.coerce.number().int().nonnegative(),
});
export type TokenInfo = z.infer<typeof TokenInfo>;

export const TokenBalance = z.number().int().nonnegative();
export type TokenBalance = z.infer<typeof TokenBalance>;
