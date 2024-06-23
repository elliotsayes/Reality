import { ArweaveId } from "@/features/arweave/lib/model";
import { ChatClient } from "../contract/chatClient";
import './Chat.css';
import { useInfiniteQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { Message } from "../contract/model";
import { truncateAddress } from "@/features/arweave/lib/utils";

const highlightedAuthorIds = [
  'kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA', // KingDummy
  'ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk', // BankerDummy
]

const queryPageSize = 10;

interface ChatProps {
  userAddress: ArweaveId;
  historyIndex?: number;
  chatClient: ChatClient;
  newMessages: Array<Message>;
  onUserMessageSent?: () => void;
}

export function Chat({
  userAddress,
  historyIndex,
  chatClient,
  newMessages,
  onUserMessageSent,
}: ChatProps) {
  const messageHistoryQuery = useInfiniteQuery({
    queryKey: ['messageHistory', chatClient.aoContractClient.processId, historyIndex],
    queryFn: async ({ pageParam }) => {
      if (pageParam === undefined) {
        return []
      }
      return chatClient.readHistory({
        idBefore: pageParam + 1,
        limit: queryPageSize,
      })
    },
    initialPageParam: historyIndex,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (nextPage) => {
      if (nextPage.length === 0) {
        return undefined
      }
      const sortedIds = nextPage
        .map(m => m.Id)
        .sort((a, b) => a - b)
      const lowestId = sortedIds[0]
      if (lowestId === 0) {
        return undefined
      }
      return lowestId
    },
  })

  const messageHistory = messageHistoryQuery.isSuccess ? messageHistoryQuery.data.pages.flatMap(x => x) : []
  const allMessages = messageHistory.concat(newMessages)

  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesRef.current) {
      // Scroll to bottom
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [allMessages])

  const form = useForm()

  return (
    <>
      <div ref={messagesRef} className="chat-page-messages-container">
        {
          renderMessages(userAddress, allMessages)
        }
      </div>

      <Form
        {...form}
      >
        <form
          className="chat-page-send-container"
          onSubmit={form.handleSubmit(async () => {
            console.log('submit')
            const message = form.getValues('message')
            form.setValue('message', '')

            if (message === undefined || message === '') return;
            await chatClient.postMessage({ Content: message, AuthorName: userAddress.slice(0, 6) })
            setTimeout(() => {
              messageHistoryQuery.refetch();
              onUserMessageSent?.();
            }, 1000)
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
          <Button
            className="chat-send-button"
            type="submit"
          >
            Send
          </Button>
        </form>
      </Form>
    </>
  )
}

function renderMessages(userAddress: string, messages: Array<Message>) {
  // if (this.state.loading)
  //   return (<Loading />);

  const divs = [];

  const messageList = messages.map((msg) => {
    return {
      id: msg.MessageId,
      address: msg.AuthorId,
      authorName: msg.AuthorName,
      message: msg.Content,
      time: msg.Timestamp,
    }
  }).sort((a, b) => a.time - b.time);

  for (let i = 0; i < messageList.length; i++) {
    const data = messageList[i];
    const owner = (data.address == userAddress);
    const highlighted = highlightedAuthorIds.includes(data.address);

    divs.push(
      <div key={data.id} className={`chat-msg-line ${owner ? 'my-line' : 'other-line'}`}>
        {!owner && <img className='chat-msg-portrait' src='llamaland_profilePic.png' />}

        <div>
          <div className={`chat-msg-header ${owner ? 'my-line' : 'other-line'}`}>
            <div className="chat-msg-nickname">
              {data.authorName}
            </div>

            <div className="chat-msg-address">{truncateAddress(data.address)}</div>
          </div>

          <div className={`chat-message ${owner ? 'my-message' : (highlighted ? 'highlight-message' : 'other-message')}`}>
            {data.message}
          </div>

          <div className={`chat-msg-time ${owner ? 'my-line' : 'other-line'}`}>
            {formatTimestamp(data.time / 1000, true)}
          </div>
        </div>

        {owner && <img className='chat-msg-portrait' src='llamaland_profilePic.png' />}
      </div>
    )
  }

  return divs.length > 0 ? divs : <div>No messages yet.</div>
}


/**
 * Format time to twitter style ones
 * @param time timestamp in seconds
 * @param ago the 'ago' suffix 
 * @returns the time formatted
 */
function formatTimestamp(time: number, ago?: boolean) {
  const m = new Map([[1, 'Jan'], [2, 'Feb'], [3, 'Mar'], [4, 'Apr'], [5, 'May'], [6, 'Jun'],
  [7, 'Jul'], [8, 'Aug'], [9, 'Sep'], [10, 'Oct'], [11, 'Nov'], [12, 'Dec']]);

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
      return m.get(month) + ' ' + day;
    }
  }

  if (hours > 0) {
    let t = hours + 'h';
    if (ago) t += ' ago';
    return t;
  }

  if (minutes > 0) {
    let t = minutes + 'm';
    if (ago) t += ' ago';
    return t;
  }

  if (seconds > 0) {
    let t = seconds + 's';
    if (ago) t += ' ago';
    return t;
  }

  return 'just now';
}

/**
 * Gets the time value of now in seconds.
 * @returns the time value in seconds
 */
function secondsOfNow() {
  return Math.floor(new Date().getTime() / 1000);
}
