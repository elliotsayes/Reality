import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createWaitlistClientForProcess } from "../contract/waitlistClient";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import humanizeDuration from "humanize-duration";
import prettyMilliseconds from 'pretty-ms';
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

const waitlistProcessId = import.meta.env.VITE_WAITLIST_PROCESS_ID! as string;
const bumpCooldown = 12 * 60 * 60 * 1000;

interface WaitlistDetailsProps {
  wallet: AoWallet;
}

export function WaitlistDetails({
  wallet,
}: WaitlistDetailsProps) {
  const resolvedWallet = wallet;

  const waitlistState = useSuspenseQuery({
    queryKey: ['waitlist', waitlistProcessId, resolvedWallet.address, 'state'],
    queryFn: async () => {
      const waitlistCLient = createWaitlistClientForProcess(resolvedWallet)(waitlistProcessId)
      return waitlistCLient.readState();
    },
    refetchInterval: 10_000,
  })

  const waitlistRegister = useMutation({
    mutationKey: ['waitlist', waitlistProcessId, resolvedWallet.address, 'register'],
    mutationFn: async () => {
      const waitlistCLient = createWaitlistClientForProcess(resolvedWallet)(waitlistProcessId)
      return await waitlistCLient.register();
    },
    onSuccess: () => {
      waitlistState.refetch();
    },
  });

  const walletlistBump = useMutation({
    mutationKey: ['waitlist', waitlistProcessId, resolvedWallet.address, 'bump'],
    mutationFn: async () => {
      const waitlistCLient = createWaitlistClientForProcess(resolvedWallet)(waitlistProcessId)
      return await waitlistCLient.bump();
    },
    onSuccess: () => {
      waitlistState.refetch();
    },
  });

  const lastBump = waitlistState.data.User?.TimestampLastBumped
  const [timeLeft, setTimeLeft] = useState(bumpCooldown - 1)
  const canBump = timeLeft <= 0;

  useEffect(() => {
    if (!lastBump) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastBump;
      const timeLeft = Math.max(bumpCooldown - diff, 0);
      setTimeLeft(timeLeft);
    }, 1000)

    return () => clearInterval(interval)
  }, [lastBump, walletlistBump])


  return (
    <div
      className="flex flex-col justify-evenly items-center h-72 min-h-44 text-center px-4 z-20"
      style={{
        fontFamily: "'Press Start 2P",
      }}
    >
      {
        waitlistState.data.User === undefined ? (
          <p className="text-xl">
            You are not on the Waitlist yet!
          </p>
        ) : (
          <p className="text-xl leading-8">
            You are <span className="text-purple-300">{waitlistState.data.UserPosition}</span>/<span className="text-purple-300">{waitlistState.data.Count}</span> in line<br />
            with
            <img src="assets/branding/LLAMA_coin_icon.png" height={30} width={30} className="inline-block mb-2 ml-2 mr-1"></img>
            <span className={`bg-gradient-to-r from-[#cb559e] via-[#EBAEC6] to-[#d47deb] inline-block text-transparent bg-clip-text transition-colors`}>
              {waitlistState.data.User.BumpCount + 1}
              {' '}
              $LLAMA
            </span>
          </p>  
        )
      }
      {
        waitlistState.data.User !== undefined && (

          timeLeft > 0 ? (
            <p className="text-sm max-w-2xl">
              Come back in <span className="italic text-purple-300">{prettyMilliseconds(timeLeft, {verbose: true, secondsDecimalDigits: 0 })}</span> and bump your spot for more $LLAMA!
            </p>
          ) : (
            <p className="text-sm hidden">
              .
            </p>
          )
        )
      }
      {
        waitlistState.data.User === undefined ? (
          <Button
            onClick={() => waitlistRegister.mutate()}
            disabled={waitlistRegister.isPending || waitlistRegister.isSuccess}
            size={"lg"}
            className="px-8 py-6 z-20 bg-gradient-to-r from-[#d47deb] via-[#e570ac] to-[#cb559e] hover:via-[#EBAEC6] hover:to-[#cb559e]"
          >
            Sign me up!
          </Button>
        ) : 
          canBump ? (
            <Button
              onClick={() => walletlistBump.mutate()}
              disabled={walletlistBump.isPending || walletlistBump.isSuccess}
              size={"lg"}
              className={`px-8 py-6 z-20 bg-gradient-to-r from-[#d47deb] via-[#e570ac] to-[#cb559e] hover:via-[#EBAEC6] hover:to-[#cb559e] mt-2 animate-bounce`}
            >
              Bump your $LLAMA!
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip open={true}>
                <TooltipTrigger className="cursor-wait opacity-80">
                  <Button
                    onClick={() => walletlistBump.mutate()}
                    disabled={true}
                    size={"lg"}
                    className={`px-8 py-6 z-20 bg-indigo-950/80`}
                  >
                    Claim $LLAMA and Enter!
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="opacity-50">
                  <TooltipArrow className="animate-pulse" />
                  <div className="text-xs bg-black px-2 py-1 rounded-md">
                    Coming soon!
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
      }
    </div>
  )
}
