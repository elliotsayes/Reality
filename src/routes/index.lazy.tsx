import { WaitlistScreen } from "@/features/waitlist/components/WaitlistScreen";
import { WaitlistSplash } from "@/features/waitlist/components/WaitlistSplash";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <WaitlistSplash loginTitle="Sign in" temporaryWalletEnabled={false}>
      {(wallet) => <WaitlistScreen wallet={wallet} />}
    </WaitlistSplash>
  );
}
