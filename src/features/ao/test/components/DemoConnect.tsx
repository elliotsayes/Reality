import { useState } from "react";
import { AoWallet } from "../../lib/aoWallet";
import { DemoAo } from "./DemoAo";
import { permissionsRequested } from "../../lib/config";
import { WalletType, wallets } from "../../lib/wallets";

export function DemoConnect() {
  const [aoWallet, setAoWallet] = useState<AoWallet | null>(null);
  const [walletOption, setWalletOption] = useState<WalletType>(WalletType[0]);

  return (
    <div>
      <h1>Demo Connect</h1>
      <select
        onChange={(e) => setWalletOption(e.target.value as WalletType)}
        value={walletOption}
      >
        {WalletType.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <br />
      <button
        onClick={async () => {
          if (!walletOption) {
            return;
          }
          setAoWallet(null);
          const walletConnector = wallets[walletOption];
          const res = await walletConnector(
            {
              permissionsRequested: permissionsRequested,
            },
            () => setAoWallet(null),
          );
          if (res.success) {
            setAoWallet(res.result);
          } else {
            console.error(res.error);
          }
        }}
      >
        Connect
      </button>
      {aoWallet && (
        <div>
          <h2>Connected</h2>
          <p>Address: {aoWallet.address}</p>
          <DemoAo aoWallet={aoWallet} />
        </div>
      )}
    </div>
  );
}
