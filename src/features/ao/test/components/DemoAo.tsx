import { connect } from "@permaweb/aoconnect";
import { AoWallet } from "../../lib/aoWallet";

type UserNew = {
  name: string;
  avatar: string;
  status: string;
  currentWorldId: string;
  following: {
    [address: string]: boolean;
  };
};

const userNew: UserNew = {
  name: "Elliot",
  avatar: "a123",
  status: "s123",
  currentWorldId: "w123",
  following: {},
};

interface DemoAoProps {
  aoWallet: AoWallet;
}

export function DemoAo({ aoWallet }: DemoAoProps) {
  const aoClient = connect();

  return (
    <div>
      <h1>DemoAo</h1>
      <button
        onClick={async () => {
          const res = await aoClient.message({
            process: "PHHOfjFPSbn7TQT1Z-dB4ndyIyppHV5haMPCg8dIccs",
            data: JSON.stringify(userNew),
            tags: [{ name: "Action", value: "Register" }],
            signer: aoWallet.signer,
          });
          console.log(res);
        }}
      >
        Sign
      </button>
    </div>
  );
}
