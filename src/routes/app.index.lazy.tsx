import { Login } from "@/features/login/components/Login";
import { WaitlistScreen } from "@/features/waitlist/components/WaitlistScreen";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/app/")({
  component: WaitlistRoute,
});

function WaitlistRoute() {
  return (
    <Login
      loginTitle="Sign in to access the Waitlist"
      temporaryWalletEnabled={false}
    >
      {(wallet, disconnect) => <WaitlistScreen wallet={wallet} />}
    </Login>
  );
}
