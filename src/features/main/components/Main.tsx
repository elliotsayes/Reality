import { Button } from "@/components/ui/button";
import { createAoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { createChatClientForProcess } from "@/features/chat/contract/chatClient";
import { ProfileInfo } from "@/features/profile/contract/model";
import { createProfileRegistryClientForProcess } from "@/features/profile/contract/profileRegistryClient";
import { Renderer } from "@/features/render/components/Renderer";
import { createVerseClientForProcess } from "@/features/verse/contract/verseClient";
import { mainMachine } from "../machines/mainMachine";
import { useMachine } from "@xstate/react";
import ProfileButton from "@/features/profile/components/ProfileButton";

const profileRegistryProcessId = import.meta.env.VITE_PROFILE_PROCESS_ID as string;

interface MainProps {
  wallet: AoWallet;
  disconnect: () => void;
  verseId?: string;
}

export default function Main({
  wallet,
  disconnect,
  verseId,
}: MainProps) {
  const profileRegistryClient = createProfileRegistryClientForProcess(wallet)(
    profileRegistryProcessId,
  )

  const [current, send] = useMachine(mainMachine, {
    input: {
      initialContext: {
        address: wallet.address,
        profileRegistryClient,
      },
    },
  });

  const renderer = (profile?: {
    profileId: string;
    profileInfo: ProfileInfo;
  }) => (
    <Renderer
      userAddress={wallet.address}
      aoContractClientForProcess={createAoContractClientForProcess(
        wallet,
      )}
      profileRegistryClient={profileRegistryClient}
      verseClientForProcess={createVerseClientForProcess(wallet)}
      chatClientForProcess={createChatClientForProcess(wallet)}
      initialVerseId={verseId}
      profileInfo={profile?.profileInfo}
    />
  )

  return (<div>
    <div className="flex flex-row gap-4 items-center fixed top-0 right-0 py-2 px-2">
      <p>
        Wallet:{" "}
        <span className="font-mono text-sm text-muted-foreground">
          {truncateAddress(wallet.address)}
        </span>
      </p>
      <ProfileButton
        profileInfo={current.context.profileInfo}
      />
      <Button onClick={disconnect} size={"sm"} variant={"secondary"}>
        Log out
      </Button>
    </div>
    <div className="fixed top-14 right-0 left-0 bottom-0">
      {
        current.hasTag("showRenderer") ? (
          current.matches("Complete with Profile") ? (
            renderer({
              profileId: current.context.profileId!,
              profileInfo: current.context.profileInfo!,
            })
          ) : (
            renderer()
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl font-bold">Loading profile...</p>
          </div>
        )
      }
    </div>
  </div>
  )
}
