import { ArweaveId } from "@/features/arweave/lib/model";
import { z } from "zod";

// Placeholder
// TODO: Define this properly
export const ChatMessage = z.object({
  Id: z.number(),
  MessageId: ArweaveId,
  Timestamp: z.number(),
  AuthorId: ArweaveId,
  AuthorName: z.string(),
  Recipient: z.optional(z.union([ArweaveId, z.null()])),
  Content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export const ChatMessageHistory = z.array(ChatMessage);
export type ChatMessageHistory = z.infer<typeof ChatMessageHistory>;

export const ChatMessageCreate = ChatMessage.omit({
  Id: true,
  MessageId: true,
  Timestamp: true,
  AuthorId: true,
});
export type ChatMessageCreate = z.infer<typeof ChatMessageCreate>;
