import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connectInjectedWallet } from "@/features/ao/lib/wallets/injected";
import { connectOthentWallet } from "@/features/ao/lib/wallets/othent";
import { toast } from "sonner";
import { defaultConnectConfig } from "../lib/config";
import { Cog, Mail, Wallet, WandSparkles } from "lucide-react"

interface LoginMenuProps {
  onConnect: (wallet: AoWallet, disconnect?: () => void) => void;
  onDisconnect: () => void;
  localWallet?: AoWallet;
  loginTitle?: string;
  temporaryWalletEnabled?: boolean;
}

export function LoginMenu({ onConnect, onDisconnect, localWallet, loginTitle, temporaryWalletEnabled }: LoginMenuProps) {
  const hasLocalWallet = localWallet !== undefined;
  const hasInjectedArweave = !!window.arweaveWallet;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>{loginTitle ?? "Login with an Arweave wallet"}</CardTitle>
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
                <span className="pr-2">
                  <Wallet />
                </span>
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
                <span className="pr-2">
                  <Mail />
                </span>
                Othent (via Google)
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                Log in with a special wallet secured by your Google account
              </p>
            </TooltipContent>
          </Tooltip>
          {
            temporaryWalletEnabled !== false && (
              <Tooltip disableHoverableContent>
                <TooltipTrigger
                  asChild
                  disabled={!hasLocalWallet}
                  onClick={() => {
                    onConnect(localWallet!)
                  }}
                >
                  <Button>
                    <span className="pr-2">
                      {hasLocalWallet
                      ? <WandSparkles />
                      : <Cog className="animate-spin" />}
                    </span>
                    Temporary Wallet
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    Log in with a temporary wallet stored in your browser
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          }
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
