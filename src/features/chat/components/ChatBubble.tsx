import { useProfileInfo } from "@/features/profile/hooks/useProfileInfo";
import { ChatMessage } from "../contract/model";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { formatTimestamp } from "../utils/formatting";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { ArweaveTxId } from "@/features/arweave/lib/model";

const kingAddress = "kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA";
const bankerAddress = "ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk";

const highlightedAuthorIds = [kingAddress, bankerAddress];

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
    : "llamaland_profilePic_8bit_user.png";

  const isUser = chatMessage.AuthorId === userAddress;
  const isHighlighted =
    highlightedAuthorIds.includes(chatMessage.AuthorId) ||
    (chatMessage.Recipient !== undefined &&
      chatMessage.Recipient === userAddress);
  const isKing = chatMessage.AuthorId === kingAddress;

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

          <div className="chat-msg-address">
            {truncateAddress(chatMessage.AuthorId)}
          </div>
        </div>

        <div
          className={`chat-message ${isKing ? "king-message" : ""} ${isUser ? "my-message" : isHighlighted ? "highlight-message" : "other-message"}`}
        >
          <div className="chat-bubble-tail-graphic"></div>
          <div className="chat-inner-text">{chatMessage.Content}</div>
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
