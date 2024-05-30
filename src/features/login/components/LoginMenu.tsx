import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connectInjectedWallet } from "@/features/ao/lib/wallets/injected";
import { connectOthentWallet } from "@/features/ao/lib/wallets/othent";
import { toast } from "sonner";
import { defaultConnectConfig } from "../lib/config";

interface LoginMenuProps {
  onConnect: (wallet: AoWallet, disconnect?: () => void) => void;
  onDisconnect: () => void;
  localWallet?: AoWallet;
}

export function LoginMenu({ onConnect, onDisconnect, localWallet }: LoginMenuProps) {
  const hasLocalWallet = localWallet !== undefined;
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
                  const wallet = await connectInjectedWallet(defaultConnectConfig, onDisconnect)
                  if (wallet.success) {
                    onConnect(wallet.result, wallet.disconnect)
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
                const wallet = await connectOthentWallet(defaultConnectConfig, onDisconnect)
                if (wallet.success) {
                  onConnect(wallet.result, wallet.disconnect)
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
              disabled={!hasLocalWallet}
              onClick={() => {
                onConnect(localWallet!)
              }}
            >
              <Button>
                {hasLocalWallet ? '🆕' : '⚙️'} Temporary Wallet
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
