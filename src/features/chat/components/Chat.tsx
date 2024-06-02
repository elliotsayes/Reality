import { ArweaveId } from "@/features/arweave/lib/model";
import { ChatClient } from "../contract/chatClient";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/features/arweave/lib/utils";
import './Chat.css';

interface ChatProps {
  userAddress: ArweaveId;
  chatClient?: ChatClient;
  onUserMessageSent?: () => void;
}

export function Chat({
  userAddress,
  chatClient,
  onUserMessageSent,
}: ChatProps) {

  return (
    <div>
      <h1>Chat</h1>
      <p>User Address: {truncateAddress(userAddress)}</p>
      <p>Chat Client Process Id: {chatClient?.aoContractClient.processId !== undefined
        ? truncateAddress(chatClient?.aoContractClient.processId)
        : "None"}</p>
      <Button
        onClick={onUserMessageSent}
      >
        Fire `onUserMessageSent`
      </Button>

      <div className="chat-page-messages-container">
        {renderMessages()}
      </div>

      <div className='chat-page-send-container'>
        <input
          id='input_msg'
          className="chat-input-message"
          placeholder="message"
        // value={this.state.msg}
        // onChange={(e) => this.setState({ msg: e.target.value })}
        // onKeyDown={this.handleKeyDown}
        />
        <button className="chat-send-button" onClick={() => sendMessage()}>Send</button>
      </div>
    </div>
  )
}

function sendMessage() {
  console.log("Send message.");
}

function renderMessages() {
  // if (this.state.loading)
  //   return (<Loading />);

  let divs = [];

  // the fake messages for testing
  let messages = [
    {
      "address": "OZyW6inTbP088ZejEW4rRxN6f6L8PXXqkGc56tReaW0",
      "friend": "95CWRAW4SA7wiWWNGa38RPnlTyIJnELeWQ0QPOPM89c",
      "message": "Hey kz-brave!",
      "time": 1714133437
    },
    {
      "address": "95CWRAW4SA7wiWWNGa38RPnlTyIJnELeWQ0QPOPM89c",
      "friend": "OZyW6inTbP088ZejEW4rRxN6f6L8PXXqkGc56tReaW0",
      "message": "Hey iamgamelover!",
      "time": 1714133481
    },
    {
      "address": "OZyW6inTbP088ZejEW4rRxN6f6L8PXXqkGc56tReaW0",
      "friend": "95CWRAW4SA7wiWWNGa38RPnlTyIJnELeWQ0QPOPM89c",
      "message": "How are you doing?",
      "time": 1714133508
    },
    {
      "address": "95CWRAW4SA7wiWWNGa38RPnlTyIJnELeWQ0QPOPM89c",
      "friend": "OZyW6inTbP088ZejEW4rRxN6f6L8PXXqkGc56tReaW0",
      "message": "Keep going to building. I like it. 💪🍺",
      "time": 1714133588
    },
    {
      "address": "OZyW6inTbP088ZejEW4rRxN6f6L8PXXqkGc56tReaW0",
      "friend": "95CWRAW4SA7wiWWNGa38RPnlTyIJnELeWQ0QPOPM89c",
      "message": "Sure! Let's do it! 😄☕️",
      "time": 1714133623
    },
    {
      "address": "OZyW6inTbP088ZejEW4rRxN6f6L8PXXqkGc56tReaW0",
      "friend": "95CWRAW4SA7wiWWNGa38RPnlTyIJnELeWQ0QPOPM89c",
      "message": "gm☕️",
      "time": 1714193953
    }
  ];

  // the fake user's data for testing
  let address = "OZyW6inTbP088ZejEW4rRxN6f6L8PXXqkGc56tReaW0";
  let my_nickname = 'iamgamelover';
  let friend_nickname = 'kz-brave';

  for (let i = 0; i < messages.length; i++) {
    let data = messages[i];
    let owner = (data.address == address);

    divs.push(
      <div key={i} className={`chat-msg-line ${owner ? 'my-line' : 'other-line'}`}>
        {!owner && <img className='chat-msg-portrait' src='/portrait-default.png' />}

        <div>
          <div className={`chat-msg-header ${owner ? 'my-line' : 'other-line'}`}>
            <div className="chat-msg-nickname">{
              owner
                ? shortStr(my_nickname, 15)
                : shortStr(friend_nickname, 15)}
            </div>

            <div className="chat-msg-address">{shortAddr(data.address, 3)}</div>
          </div>

          <div className={`chat-message ${owner ? 'my-message' : 'other-message'}`}>
            {data.message}
          </div>

          <div className={`chat-msg-time ${owner ? 'my-line' : 'other-line'}`}>
            {formatTimestamp(data.time, true)}
          </div>
        </div>

        {owner && <img className='chat-msg-portrait' src='/portrait-default.png' />}
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
export function formatTimestamp(time: number, ago?: boolean) {

  const m = new Map([[1, 'Jan'], [2, 'Feb'], [3, 'Mar'], [4, 'Apr'], [5, 'May'], [6, 'Jun'],
  [7, 'Jul'], [8, 'Aug'], [9, 'Sep'], [10, 'Oct'], [11, 'Nov'], [12, 'Dec']]);

  let now = secondsOfNow();
  let diff = now - time;

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
};

/**
 * Gets the time value of now in seconds.
 * @returns the time value in seconds
 */
export function secondsOfNow() {
  return Math.floor(new Date().getTime() / 1000);
}

export function shortStr(str: string, max: number) {
  if (str.length > max) {
    return str.substring(0, max) + '...';
  }
  return str;
}

export function shortAddr(str: string, num: number) {
  return str.substring(0, num) + '...' + str.substring(str.length - num);
}