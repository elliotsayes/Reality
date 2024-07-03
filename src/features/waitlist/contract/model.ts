import { z } from "zod";

export const WaitlistEntry = z.object({
  Rank: z.number(),
  Id: z.number(),
  TimestampCreated: z.number(),
  TimestampLastBumped: z.number(),
  BumpCount: z.number(),
  Authorised: z.optional(z.number()),
});
export type WaitlistEntry = z.infer<typeof WaitlistEntry>;

export const RankList = z.array(WaitlistEntry);
export type RankList = z.infer<typeof RankList>;

export const WaitlistState = z.object({
  RankAsc: RankList,
  RankAscSurrounding: RankList,
  RankDesc: RankList,
  Count: z.number(),
  UserPosition: z.number(),
  User: z.optional(WaitlistEntry),
});
export type WaitlistState = z.infer<typeof WaitlistState>;
