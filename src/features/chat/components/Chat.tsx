import { ArweaveId } from "@/features/arweave/lib/model";
import { ChatClient } from "../contract/chatClient";
import "./Chat.css";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { Message } from "../contract/model";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { ProfileInfo } from "@/features/profile/contract/model";

const highlightedAuthorIds = [
  "kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA", // KingDummy
  "ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk", // BankerDummy
];

const queryPageSize = 10;

interface ChatProps {
  userAddress: ArweaveId;
  userProfile?: ProfileInfo;
  historyIndex?: number;
  chatClient: ChatClient;
  newMessages: Array<Message>;
  onUserMessageSent?: () => void;
}

export function Chat({
  userAddress,
  userProfile,
  historyIndex,
  chatClient,
  newMessages,
  onUserMessageSent,
}: ChatProps) {
  const messageHistoryQuery = useInfiniteQuery({
    queryKey: [
      "messageHistory",
      chatClient.aoContractClient.processId,
      historyIndex,
    ],
    queryFn: async ({ pageParam }) => {
      if (pageParam === undefined) {
        return [];
      }
      return chatClient.readHistory({
        idBefore: pageParam + 1,
        limit: queryPageSize,
      });
    },
    initialPageParam: historyIndex,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (nextPage) => {
      if (nextPage.length === 0) {
        return undefined;
      }
      const sortedIds = nextPage.map((m) => m.Id).sort((a, b) => a - b);
      const lowestId = sortedIds[0];
      if (lowestId === 0) {
        return undefined;
      }
      return lowestId;
    },
  });

  const messageHistory = messageHistoryQuery.isSuccess
    ? messageHistoryQuery.data.pages.flatMap((x) => x)
    : [];
  const allMessages = messageHistory.concat(newMessages);

  const lastMessageCount = useRef(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesRef.current) {
      if (allMessages.length === 0) return;

      if (lastMessageCount.current === 0) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        lastMessageCount.current = allMessages.length;
        return;
      }

      // Check if the user is near the bottom
      const newMessage = lastMessageCount.current !== allMessages.length;
      const nearBottom =
        messagesRef.current.scrollTop + messagesRef.current.clientHeight >=
        messagesRef.current.scrollHeight - 400;
      // Scroll to bottom
      if (newMessage && nearBottom) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        lastMessageCount.current = allMessages.length;
      }
    }
  }, [allMessages]);

  const form = useForm();

  return (
    <>
      <div ref={messagesRef} className="chat-page-messages-container">
        {renderMessages(userAddress, allMessages)}
      </div>

      <Form {...form}>
        <form
          className="chat-page-send-container"
          onSubmit={form.handleSubmit(async () => {
            console.log("submit");
            const message = form.getValues("message");
            form.setValue("message", "");

            if (message === undefined || message === "") return;
            await chatClient.postMessage({
              Content: message,
              AuthorName:
                userProfile?.DisplayName ??
                userProfile?.Username ??
                userAddress.slice(0, 6),
            });
            setTimeout(() => {
              messageHistoryQuery.refetch();
              onUserMessageSent?.();
            }, 1000);
          })}
        >
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="chat-input-message"
                    placeholder="Message"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button className="chat-send-button" type="submit">
            <div className="chat-send-button-inner-text">Send</div>
            <div className="chat-send-button-back"></div>
          </Button>
        </form>
      </Form>
    </>
  );
}

function renderMessages(userAddress: string, messages: Array<Message>) {
  // if (this.state.loading)
  //   return (<Loading />);

  const divs = [];

  const messageList = messages
    .map((msg) => {
      return {
        id: msg.MessageId,
        address: msg.AuthorId,
        authorName: msg.AuthorName,
        message: msg.Content,
        time: msg.Timestamp,
      };
    })
    .sort((a, b) => a.time - b.time);

  for (let i = 0; i < messageList.length; i++) {
    const data = messageList[i];
    const owner = data.address == userAddress;
    const highlighted = highlightedAuthorIds.includes(data.address);
    const isKing =
      data.address === "kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA";

    divs.push(
      <div
        key={data.id}
        className={`chat-msg-line ${owner ? "my-line" : "other-line"}`}
      >
        {!owner && !isKing && (
          <img
            className="chat-msg-portrait"
            src="llamaland_profilePic_8bit.png"
          />
        )}

        {isKing && (
          <img
            className="chat-msg-portrait"
            src="llamaland_profilePic_8bit_king.png"
          />
        )}

        <div>
          <div
            className={`chat-msg-header ${owner ? "my-line" : "other-line"}`}
          >
            <div className="chat-msg-nickname">{data.authorName}</div>

            <div className="chat-msg-address">
              {truncateAddress(data.address)}
            </div>
          </div>

          <div
            className={`chat-message ${isKing ? "king-message" : ""} ${owner ? "my-message" : highlighted ? "highlight-message" : "other-message"}`}
          >
            <div className="chat-bubble-tail-graphic"></div>
            <div className="chat-inner-text">{data.message}</div>
            <div className="highlight-message-back"></div>
          </div>

          <div className={`chat-msg-time ${owner ? "my-line" : "other-line"}`}>
            {formatTimestamp(data.time / 1000, true)}
          </div>
        </div>

        {owner && (
          <img
            className="chat-msg-portrait"
            src="llamaland_profilePic_8bit_user.png"
          />
        )}
      </div>,
    );
  }

  return divs.length > 0 ? divs : <div>No messages yet.</div>;
}

/**
 * Format time to twitter style ones
 * @param time timestamp in seconds
 * @param ago the 'ago' suffix
 * @returns the time formatted
 */
function formatTimestamp(time: number, ago?: boolean) {
  const m = new Map([
    [1, "Jan"],
    [2, "Feb"],
    [3, "Mar"],
    [4, "Apr"],
    [5, "May"],
    [6, "Jun"],
    [7, "Jul"],
    [8, "Aug"],
    [9, "Sep"],
    [10, "Oct"],
    [11, "Nov"],
    [12, "Dec"],
  ]);

  const now = secondsOfNow();
  const diff = now - time;

  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = Math.floor(diff % 60);

  if (days > 0) {
    const date = new Date(time * 1000);

    if (days > 365) {
      return date.toLocaleString();
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return m.get(month) + " " + day;
    }
  }

  if (hours > 0) {
    let t = hours + "h";
    if (ago) t += " ago";
    return t;
  }

  if (minutes > 0) {
    let t = minutes + "m";
    if (ago) t += " ago";
    return t;
  }

  if (seconds > 0) {
    let t = seconds + "s";
    if (ago) t += " ago";
    return t;
  }

  return "just now";
}

/**
 * Gets the time value of now in seconds.
 * @returns the time value in seconds
 */
function secondsOfNow() {
  return Math.floor(new Date().getTime() / 1000);
}
