import { ArweaveId } from "@/features/arweave/lib/model";
import { z } from "zod";

// Placeholder
// TODO: Define this properly
export const Message = z.object({
  Created: z.number(),
  Author: ArweaveId,
  Content: z.string(),
});
export type Message = z.infer<typeof Message>;

export const MessagesKeyed = z.record(
  ArweaveId,
  Message,
);
export type MessagesKeyed = z.infer<typeof MessagesKeyed>;

export const MessageCreate = Message.omit({
  Created: true,
  Author: true,
});
export type MessageCreate = z.infer<typeof MessageCreate>;
