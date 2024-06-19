import React from "react";

import { AoWallet } from "@/features/ao/lib/aoWallet";
import { LoginMenu } from "./LoginMenu";
import { useMachine } from "@xstate/react";
import { loginMachine } from "../machines/loginMachine";
import { Button } from "@/components/ui/button";
import { inspect } from "@/lib/xstate";
import {
  ProfileHeaderType,
  getProfileByWalletAddress,
} from "@/features/profile/profiles";

interface LoginProps {
  children: (wallet: AoWallet, disconnect: () => void) => React.ReactNode;
}

export function Login({ children }: LoginProps) {
  const [current, send] = useMachine(loginMachine, { inspect });

  const [profile, setProfile] = React.useState<ProfileHeaderType | null>(null);

  React.useEffect(() => {
    (async function () {
      if (current.context.wallet && current.context.wallet.address) {
        try {
          setProfile(
            await getProfileByWalletAddress({
              address: current.context.wallet.address,
            })
          );
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [current]);

  if (profile && !profile.id) {
    return <p>Create profile</p>
  }

  if (current.matches({ "Logging In": "Show Login UI" })) {
    return (
      <div className="flex flex-col flex-grow justify-around items-center h-full">
        <LoginMenu
          onConnect={(wallet, disconnect) =>
            send({
              type: "Connect",
              data: { wallet, disconnect: disconnect ?? (() => {}) },
            })
          }
          onDisconnect={() => send({ type: "External Disconnect" })}
          localWallet={current.context.localWallet}
        />
        <div />
      </div>
    );
  }

  if (current.matches("Logged In") && profile && profile.id) {
    if (current.context.wallet === undefined) {
      throw new Error("Wallet is undefined");
    }
    return children(current.context.wallet, () => send({ type: "Disconnect" }));
  }

  return (
    <div className="flex flex-col flex-grow justify-center items-center h-full">
      <div className="text-2xl">Logging in...</div>
      <Button onClick={() => window.location.reload()} className="mt-4">
        Reload
      </Button>
    </div>
  );
}
