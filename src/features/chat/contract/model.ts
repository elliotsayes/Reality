import { ArweaveId } from "@/features/arweave/lib/model";
import { z } from "zod";

// Placeholder
// TODO: Define this properly
export const Message = z.object({
  MessageId: ArweaveId,
  Timestamp: z.number(),
  AuthorId: ArweaveId,
  AuthorName: z.string(),
  Content: z.string(),
});
export type Message = z.infer<typeof Message>;

export const MessageCreate = Message.omit({
  MessageId: true,
  Timestamp: true,
  AuthorId: true,
});
export type MessageCreate = z.infer<typeof MessageCreate>;
