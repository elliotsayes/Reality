import { Button } from "@/components/ui/button";
import { createAoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { createChatClientForProcess } from "@/features/chat/contract/chatClient";
import { ProfileAssets, ProfileInfo } from "@/features/profile/contract/model";
import { createProfileRegistryClientForProcess } from "@/features/profile/contract/profileRegistryClient";
import { Renderer } from "@/features/render/components/Renderer";
import { createRealityClientForProcess } from "@/features/reality/contract/realityClient";
import { mainMachine } from "../machines/mainMachine";
import { useMachine } from "@xstate/react";
import ProfileButton from "@/features/profile/components/ProfileButton";
import { createTrackingClientForProcess } from "@/features/tracking/contract/trackingClient";
import { createProfileClientForProcess } from "@/features/profile/contract/profileClient";

const profileRegistryProcessId = import.meta.env
  .VITE_PROFILE_PROCESS_ID as string;

interface MainProps {
  wallet: AoWallet;
  disconnect: () => void;
  worldId?: string;
}

export default function Main({ wallet, disconnect, worldId }: MainProps) {
  const profileRegistryClient = createProfileRegistryClientForProcess(wallet)(
    profileRegistryProcessId,
  );
  const trackingClient = createTrackingClientForProcess(wallet)(
    import.meta.env.VITE_TRACKING_TEST_PROCESS_ID,
  );

  const aoContractClientForProcess = createAoContractClientForProcess(wallet);

  const profileClientForProcess = createProfileClientForProcess(wallet);

  const realityClientForProcess = createRealityClientForProcess(wallet);

  const realityClientBaseWorldId = realityClientForProcess(worldId || "");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [current, send] = useMachine(mainMachine, {
    input: {
      initialContext: {
        address: wallet.address,
        profileRegistryClient,
        profileClientForProcess,
        aoContractClientForProcess,
        realityClientBaseWorldId
      },
    },
  });

  const renderer = (profile?: {
    profileId: string;
    profileInfo: ProfileInfo;
    assets: ProfileAssets;
  }) => (
    <Renderer
      userAddress={wallet.address}
      aoContractClientForProcess={aoContractClientForProcess}
      profileRegistryClient={profileRegistryClient}
      trackingClient={trackingClient}
      realityClientForProcess={realityClientForProcess}
      chatClientForProcess={createChatClientForProcess(wallet)}
      initialRealityId={worldId}
      profileInfo={profile?.profileInfo}
    />
  );

  return (
    <div>
      <div className="flex flex-row gap-4 items-center fixed top-0 right-0 py-2 px-2">
        <p>
          <span className=" font-Press-Start-2P text-[10px]">Wallet </span>
          <a
            href={`https://www.ao.link/#/entity/${wallet.address}?tab=balances`}
            target="_blank"
            className="hover:underline font-mono text-sm text-muted-foreground"
          >
            {truncateAddress(wallet.address)}
          </a>
        </p>
        <ProfileButton profileInfo={current.context.profileInfo} assets={current.context.assets} />
        <Button onClick={disconnect} size={"sm"} variant={"secondary"}>
          Log out
        </Button>
      </div>
      <div className="fixed top-14 right-0 left-0 bottom-0">
        {current.hasTag("showRenderer") ? (
          current.matches("Complete with Profile") ? (
            renderer({
              profileId: current.context.profileId!,
              profileInfo: current.context.profileInfo!,
              assets: current.context.assets!,
            })
          ) : (
            renderer()
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl font-bold">Loading profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}
