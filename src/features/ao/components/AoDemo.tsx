import { connect, createDataItemSigner } from "@permaweb/aoconnect";
import { useApi } from "arweave-wallet-kit";

type UserNew = {
  name: string;
  avatar: string;
  status: string;
  currentWorldId: string;
  following: {
    [address: string]: boolean;
  };
}

const userNew: UserNew = {  
  name: "Elliot",
  avatar: "a123",
  status: "s123",
  currentWorldId: "w123",
  following: {},
}

export function AoDemo() {
  const api = useApi();

  const aoClient = connect();

  return (
    <div>
      <h1>AoDemo</h1>
      <p>
        {api ? "Has API" : "No API"}
      </p>
      <button onClick={async () => {
        if (api) {
          // const compatibleApi = {
          //   ...api,
          //   signDataItem: api.sign,
          // }
          // const signer = createDataItemSigner(compatibleApi);
          const signer = createDataItemSigner(window.arweaveWallet);
          const res = await aoClient.message({
            process: "PHHOfjFPSbn7TQT1Z-dB4ndyIyppHV5haMPCg8dIccs",
            data: JSON.stringify(userNew),
            tags: [{ name: "Action", value: "Register" }],
            signer,
          });
          console.log(res);
        }
      }}>
        Sign
      </button>
    </div>
  )
}
