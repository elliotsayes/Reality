import { useState } from "react";
import { AoWallet, AoWalletConnector } from "../lib/aoWallet";
import { createAnonymousWallet } from "../lib/wallets/anonymous";
import { connectInjectedWallet } from "../lib/wallets/injected";
import { connectOthentWallet } from "../lib/wallets/othent";
import { DemoAo } from "./DemoAo";
import { requestedPermissions } from "../lib/config";

const walletOptions: Record<string, AoWalletConnector> = {
  "Anonymous": createAnonymousWallet,
  "Injected": connectInjectedWallet,
  "Othent": connectOthentWallet,
};

export function DemoConnect() {
  const [aoWallet, setAoWallet] = useState<AoWallet | null>(null);
  const [walletOption, setWalletOption] = useState<string>(Object.keys(walletOptions)[0]);

  return (
    <div>
      <h1>Demo Connect</h1>
      <select onChange={(e) => setWalletOption(e.target.value)} value={walletOption}>
        {
          Object.keys(walletOptions).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))
        }
      </select>
      <br />
      <button onClick={async () => {
        if (!walletOption) {
          return;
        }
        setAoWallet(null);
        const walletConnector = walletOptions[walletOption];
        const res = await walletConnector(requestedPermissions);
        if (res.success) {
          setAoWallet(res.result);
        } else {
          console.error(res.error);
        }
      }}>
        Connect
      </button>
      {
        aoWallet && (
          <div>
            <h2>Connected</h2>
            <p>Address: {aoWallet.address}</p>
            <DemoAo aoWallet={aoWallet} />
          </div>
        )
      }
    </div> 
  )
}
