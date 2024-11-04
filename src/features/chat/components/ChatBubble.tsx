import { useProfileInfo } from "@/features/profile/hooks/useProfileInfo";
import { ChatMessage } from "../contract/model";
import { formatTimestamp } from "../utils/formatting";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { ArweaveTxId } from "@/features/arweave/lib/model";
import { MiniAddress } from "./MiniAddress";
import Linkify from "linkify-react";

const kingAddress = "kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA";
const king2Address = "vkMZYPIUQAktEy6etxg3ALoLfqxHbq1tkUsp95Lb3wE";
const bankerAddress = "ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk";

const highlightedAuthorIds = [kingAddress, king2Address, bankerAddress];

type ChatBubbleProps = {
  chatMessage: ChatMessage;
  userAddress?: string;
};

export const ChatBubble = ({ chatMessage, userAddress }: ChatBubbleProps) => {
  const walletId = chatMessage.AuthorId;
  const profile = useProfileInfo({
    walletId,
  });

  const resolvedDisplayName =
    profile.data?.DisplayName ?? chatMessage.AuthorName;

  const hasProfileImage = ArweaveTxId.safeParse(
    profile.data?.ProfileImage,
  ).success;
  const resolvedProfileImage = hasProfileImage
    ? fetchUrl(profile.data!.ProfileImage)
    : chatMessage.AuthorId === "o20viT_yWRooVjt7x84mobxADRM5y2XG9WMFr7U3_KQ" ||
        chatMessage.AuthorId === "ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk"
      ? "llamaland_profilePic_8bit_admin.png"
      : "llamaland_profilePic_8bit_user.png";

  const isUser = chatMessage.AuthorId === userAddress;
  const isHighlighted =
    highlightedAuthorIds.includes(chatMessage.AuthorId) ||
    (chatMessage.Recipient !== undefined &&
      chatMessage.Recipient === userAddress);
  const isKing =
    chatMessage.AuthorId === kingAddress ||
    chatMessage.AuthorId === king2Address;

  return (
    <div
      key={chatMessage.Id}
      className={`chat-msg-line ${isUser ? "my-line" : "other-line"}`}
    >
      {!isUser &&
        (isKing ? (
          <img
            className={`chat-msg-portrait ${profile.isLoading ? "animate-pulse" : ""}`}
            src="llamaland_profilePic_8bit_king.png"
          />
        ) : (
          <img className="chat-msg-portrait" src={resolvedProfileImage} />
        ))}

      <div>
        <div className={`chat-msg-header ${isUser ? "my-line" : "other-line"}`}>
          <div className="chat-msg-nickname">{resolvedDisplayName}</div>

          <div className="chat-msg-address items-baseline content-baseline">
            <MiniAddress address={chatMessage.AuthorId} />
          </div>
        </div>

        <div
          className={`chat-message ${isKing ? "king-message" : ""} ${isUser ? "my-message" : isHighlighted ? "highlight-message" : "other-message"}`}
        >
          <div className="chat-bubble-tail-graphic"></div>
          <div className="chat-inner-text">
            <Linkify
              options={{
                target: "_blank",
                className: "text-blue-200 hover:underline break-words",
              }}
            >
              {chatMessage.Content}
            </Linkify>
          </div>
          <div className="highlight-message-back"></div>
        </div>

        <div className={`chat-msg-time ${isUser ? "my-line" : "other-line"}`}>
          {formatTimestamp(chatMessage.Timestamp / 1000, true)}
        </div>
      </div>

      {isUser && (
        <img
          className={`chat-msg-portrait ${profile.isLoading ? "animate-pulse" : ""}`}
          src={resolvedProfileImage}
        />
      )}
    </div>
  );
};

export default ChatBubble;
