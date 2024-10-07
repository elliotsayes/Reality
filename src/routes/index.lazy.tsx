import { AoWallet } from "@/features/ao/lib/aoWallet";
import Main from "@/features/main/components/Main";
import { WaitlistScreen } from "@/features/waitlist/components/WaitlistScreen";
import { WaitlistSplash } from "@/features/waitlist/components/WaitlistSplash";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [wallet, setWallet] = useState<AoWallet | null>(null);

  if (wallet === null) {
    return (
      <WaitlistSplash loginTitle="Sign in" temporaryWalletEnabled={false}>
        {(wallet) => (
          <WaitlistScreen onEnter={() => setWallet(wallet)} wallet={wallet} />
        )}
      </WaitlistSplash>
    );
  }

  return (
    <Main
      wallet={wallet}
      disconnect={() => setWallet(null)}
      worldId={import.meta.env.VITE_LLAMA_LAND_PROCESS_ID}
    />
  );
}
