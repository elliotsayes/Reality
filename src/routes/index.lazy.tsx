import Main from "@/features/main/components/Main";
import { WaitlistScreen } from "@/features/waitlist/components/WaitlistScreen";
import { WaitlistSplash } from "@/features/waitlist/components/WaitlistSplash";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [entered, setEntered] = useState(false);

  return (
    <WaitlistSplash loginTitle="Sign in" temporaryWalletEnabled={false}>
      {entered
        ? (wallet, disconnect) => (
            <Main wallet={wallet} disconnect={disconnect} />
          )
        : (wallet) => (
            <WaitlistScreen wallet={wallet} onEnter={() => setEntered(true)} />
          )}
    </WaitlistSplash>
  );
}
