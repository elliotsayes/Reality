import { z } from "zod";

export const ArweaveId = z.string().regex(/^[a-zA-Z0-9_-]{43}$/);
export type ArweaveId = z.infer<typeof ArweaveId>;

export const ArweaveAddress = ArweaveId;
export type ArweaveAddress = ArweaveId;

export const ArweaveTxId = ArweaveId;
export type ArweaveTxId = ArweaveId;
