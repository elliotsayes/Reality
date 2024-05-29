import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connectInjectedWallet } from "@/features/ao/lib/wallets/injected";
import { createWalletFromJwk } from "@/features/ao/lib/wallets/jwk";
import { connectOthentWallet } from "@/features/ao/lib/wallets/othent";
import { defaultArweave } from "@/features/arweave/lib/arweave";
import { useQuery } from "@tanstack/react-query";
import { JWKInterface } from "arweave/node/lib/wallet";
import { toast } from "sonner";
import { connectConfig, localKeyLocalStorageKey } from "../lib/config";

interface LoginMenuProps {
  onConnect: (wallet: AoWallet) => void;
  onDisconnect: () => void;
}

export function LoginMenu({ onConnect, onDisconnect }: LoginMenuProps) {
  const localKey = useQuery({
    queryKey: ["localKey"],
    queryFn: async () => {
      const storedJwkString = localStorage.getItem(localKeyLocalStorageKey);
      
      if (storedJwkString) {
        const storedJwk: JWKInterface = JSON.parse(storedJwkString);
        const creationResult = await createWalletFromJwk(storedJwk, true)(connectConfig);
        if (creationResult.success) {
          return creationResult.result;
        } else {
          throw new Error("Failed to process local key");
        }
      }

      const newJwk = await defaultArweave.wallets.generate();
      createWalletFromJwk(newJwk, true)(connectConfig);
      localStorage.setItem(localKeyLocalStorageKey, JSON.stringify(newJwk));

      const creationResult = await createWalletFromJwk(newJwk, true)(connectConfig);
      if (creationResult.success) {
        return creationResult.result;
      } else {
        throw new Error("Failed to process generated key");
      }
    },
  })

  const hasInjectedArweave = !!window.arweaveWallet;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Login with an Arweave wallet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 items-stretch">
          <Tooltip disableHoverableContent>
            <TooltipTrigger className="flex flex-grow">
              <Button
                onClick={async () => {
                  const wallet = await connectInjectedWallet(connectConfig, onDisconnect)
                  if (wallet.success) {
                    onConnect(wallet.result)
                  } else {
                    toast(`Failed to connect: ${wallet.error}`)
                  }
                }}
                disabled={!hasInjectedArweave}
                className={`flex flex-grow ${hasInjectedArweave ? "" : "cursor-not-allowed"}`}
              >
                ArConnect / Injected
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                {
                  hasInjectedArweave 
                    ? "Log in with your Injected Arweave Wallet"
                    : "No injected wallet. Please install ArConnect to enable this option"
                }
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip disableHoverableContent>
            <TooltipTrigger
              asChild
              onClick={async () => {
                const wallet = await connectOthentWallet(connectConfig, onDisconnect)
                if (wallet.success) {
                  onConnect(wallet.result)
                } else {
                  toast(`Failed to connect: ${wallet.error}`)
                }
              }}
            >
              <Button>
                Othent (via Google)
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                Log in with a special wallet secured by your Google account
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip disableHoverableContent>
            <TooltipTrigger
              asChild
              disabled={localKey.isLoading}
              onClick={() => {
                if (localKey.data) {
                  onConnect(localKey.data)
                }
              }}
            >
              <Button>
                {localKey.isLoading ? '⚙️' : '✨'} Temporary Wallet
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                Log in with a temporary wallet stored in your browser
              </p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
