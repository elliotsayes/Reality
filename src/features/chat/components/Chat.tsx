import { ArweaveId } from "@/features/arweave/lib/model";
import { ChatClient } from "../contract/chatClient";
import "./Chat.css";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../contract/model";
import { ProfileInfo } from "@/features/profile/contract/model";
import ChatBubble from "./ChatBubble";

import { useGameState } from "@/context/GameStateContext";

const queryPageSize = 10;

interface ChatProps {
  userAddress: ArweaveId;
  userProfile?: ProfileInfo;
  historyIndex?: number;
  chatClient: ChatClient;
  newMessages: Array<ChatMessage>;
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
    enabled: historyIndex !== undefined,
  });

  const messageHistory = messageHistoryQuery.isSuccess
    ? messageHistoryQuery.data.pages.flatMap((x) => x)
    : [];
  const allMessages = messageHistory.concat(newMessages);

  const lastMessageCount = useRef(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (historyIndex === undefined) {
      lastMessageCount.current = 0;
      return;
    }
    if (messagesRef.current) {
      if (allMessages.length === 0) return;

      if (lastMessageCount.current === 0) {
        // console.log(`First scrolling to ${messagesRef.current.scrollHeight}`);
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        lastMessageCount.current = allMessages.length;
        return;
      }

      // Check if the user is near the bottom
      const newMessages = allMessages.length - lastMessageCount.current;
      const nearBottom =
        messagesRef.current.scrollTop + messagesRef.current.clientHeight >=
        messagesRef.current.scrollHeight - newMessages * 250;
      // console.log({ newMessages, nearBottom });
      // Scroll to bottom
      if (newMessages > 0 && nearBottom) {
        // console.log(`New scrolling to ${messagesRef.current.scrollHeight}`);
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        lastMessageCount.current = allMessages.length;
      }
    }
  }, [allMessages, historyIndex]);

  const form = useForm();


  const { setChatFocus } = useGameState();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {

    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setChatFocus(false);
        inputRef.current.blur(); // Explicitly blur the input if clicking outside
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


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
                    ref={inputRef}
                    onFocus={() => setChatFocus(true)}
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

function renderMessages(userAddress: string, messages: Array<ChatMessage>) {
  // if (this.state.loading)
  //   return (<Loading />);

  const messageList = messages
    .filter((msg) => {
      const hasRecipient = typeof msg.Recipient === "string";
      const isRecipient = msg.Recipient === userAddress;

      if (hasRecipient && !isRecipient) {
        // console.warn("Skipping message with non-player recipient", msg);
        return false;
      }

      return true;
    })
    .sort((a, b) => a.Timestamp - b.Timestamp);

  if (messageList.length === 0) {
    return <div>No messages yet.</div>;
  }

  return messageList.map((msg) => (
    <ChatBubble key={msg.Id} chatMessage={msg} userAddress={userAddress} />
  ));
}
