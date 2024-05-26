import { ConnectButton, useConnection } from "arweave-wallet-kit";
import { AoDemo } from "./AoDemo";

export function ArweaveKitDemo() {
  const { connected } = useConnection();
  
  return (
    <div>
      <h1>Arweave Wallet Kit Demo</h1>
      <p>
        {connected ? "Connected" : "Disconnected"}
      </p>
      <ConnectButton
        accent="rgb(255, 0, 0)"
        useAns={true}
        profileModal={true}
      />
      <AoDemo />
    </div>
  )
}
