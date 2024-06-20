import { AoWallet } from "@/features/ao/lib/aoWallet";
import { WaitlistDetails } from "./WaitlistDetails";
import { Suspense } from "react";

interface WaitlistScreenProps {
  wallet: AoWallet;
}

export function WaitlistScreen({
  wallet,
}: WaitlistScreenProps) {
  return (
    <div className="w-[100%] h-[100%] flex flex-col items-center justify-center bg-indigo-950/80 text-white/90">
      <div className="h-[380px] flex flex-col items-center justify-start gap-1">
        <img src="assets/branding/LLAMA_coin_large.png" height={120} width={120}></img>
        <img src="assets/branding/LLAMA_purple.png" width={500}></img>
      </div>
      <Suspense fallback={(
        <div className="flex flex-col justify-center h-[25%] min-h-44">
          <p>Loading...</p>
        </div>
      )}>
        <WaitlistDetails wallet={wallet} />
      </Suspense>
      <div className="h-[10%]" />
    </div>
  )
}
