import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createWaitlistClientForProcess } from "../contract/waitlistClient";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import prettyMilliseconds from "pretty-ms";
import { Tooltip } from "@/components/ui/tooltip";
import {
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import JSConfetti from "js-confetti";

const waitlistProcessId = import.meta.env.VITE_WAITLIST_PROCESS_ID! as string;
const bumpCooldown = 12 * 60 * 60 * 1000;

interface WaitlistDetailsProps {
  wallet: AoWallet;
  onEnter: () => void;
}

export function WaitlistDetails({ wallet, onEnter }: WaitlistDetailsProps) {
  const resolvedWallet = wallet;

  const waitlistState = useSuspenseQuery({
    queryKey: ["waitlist", waitlistProcessId, resolvedWallet.address, "state"],
    queryFn: async () => {
      const waitlistCLient =
        createWaitlistClientForProcess(resolvedWallet)(waitlistProcessId);
      return waitlistCLient.readState();
    },
    refetchInterval: 10_000,
  });

  const waitlistRegister = useMutation({
    mutationKey: [
      "waitlist",
      waitlistProcessId,
      resolvedWallet.address,
      "register",
    ],
    mutationFn: async () => {
      const waitlistCLient =
        createWaitlistClientForProcess(resolvedWallet)(waitlistProcessId);
      return await waitlistCLient.register();
    },
    onSuccess: async () => {
      fireConfetti();
      await waitlistState.refetch();
    },
  });

  const walletlistBump = useMutation({
    mutationKey: [
      "waitlist",
      waitlistProcessId,
      resolvedWallet.address,
      "bump",
    ],
    mutationFn: async () => {
      const waitlistCLient =
        createWaitlistClientForProcess(resolvedWallet)(waitlistProcessId);
      return await waitlistCLient.bump();
    },
    onSuccess: async () => {
      fireConfetti();
      await waitlistState.refetch();
    },
  });

  const lastBumpMaybe = waitlistState.data.User?.TimestampLastBumped;

  const calculateTimeLeft = (lastBump: number) => {
    const now = Date.now();
    const diff = now - lastBump;
    const timeLeft = Math.max(bumpCooldown - diff, 0);
    return timeLeft;
  };
  const [timeLeft, setTimeLeft] = useState(
    calculateTimeLeft(lastBumpMaybe ?? 0),
  );
  const canRegister = false; // waitlistState.data.Count < 22_000;
  const canBump = false; // timeLeft <= 0;
  const canEnter = waitlistState.data.User?.Authorised === 1;
  const isClaimed = waitlistState.data.User?.Claimed === 1;

  useEffect(() => {
    if (!lastBumpMaybe) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(lastBumpMaybe));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBumpMaybe, walletlistBump]);

  const hasCreatedJsConfetti = useRef(false);
  const [jsConfetti, setJsConfetti] = useState<JSConfetti | null>(null);
  useEffect(() => {
    if (hasCreatedJsConfetti.current) {
      return;
    }
    hasCreatedJsConfetti.current = true;
    setJsConfetti(new JSConfetti());
  }, []);

  function fireConfetti() {
    if (jsConfetti) {
      jsConfetti.addConfetti({
        emojis: ["👑", "🦙"],
        emojiSize: 60,
        confettiNumber: 50,
      });
      // enable vibration support
      navigator.vibrate =
        navigator.vibrate ||
        navigator.webkitVibrate ||
        navigator.mozVibrate ||
        navigator.msVibrate;

      if (navigator.vibrate) {
        // vibration API supported
        navigator.vibrate(100);
      }
    }
    if (jsConfetti) {
      jsConfetti.addConfetti({
        emojis: ["👑", "🦙"],
        emojiSize: 60,
        confettiNumber: 50,
      });
    }
  }

  return (
    <div
      className="flex flex-col justify-evenly items-center h-72 min-h-44 text-center px-4 z-20"
      style={{
        fontFamily: "'Press Start 2P",
      }}
    >
      {waitlistState.data.User === undefined ? (
        canRegister ? (
          <p className="text-xl">You are not on the Waitlist yet!</p>
        ) : (
          <>
            <p className="text-xl">
              The Waitlist is full with{" "}
              <span className="text-purple-300">
                {waitlistState.data.Count}
              </span>{" "}
              Llamas!
            </p>
            <p>
              Follow{" "}
              <a
                href="https://x.com/LlamaLandAO"
                className="text-purple-300 underline"
              >
                @LlamaLandAO
              </a>{" "}
              on X for updates.
            </p>
          </>
        )
      ) : (
        <p className="text-xl leading-8">
          {canEnter ? (
            <>
              <span className="bg-gradient-to-r from-[#cb559e] via-[#EBAEC6] to-[#d47deb] inline-block text-transparent bg-clip-text">
                You have been granted
                <br />
                access to Llama Land!
              </span>{" "}
            </>
          ) : (
            <>
              You are{" "}
              <span className="text-purple-300">
                {waitlistState.data.UserPosition}
              </span>
              /
              <span className="text-purple-300">
                {waitlistState.data.Count}
              </span>{" "}
              in line!
              <br />
            </>
          )}
          {!isClaimed && canEnter && (
            <div className="flex flex-row justify-center flex-wrap">
              Waitlist earnings:
              <p>
                <img
                  src="assets/branding/LLAMA_coin_icon.png"
                  height={30}
                  width={30}
                  className="inline-block mb-2 ml-2 mr-1"
                ></img>
                <span
                  className={`bg-gradient-to-r from-[#cb559e] via-[#EBAEC6] to-[#d47deb] inline-block text-transparent bg-clip-text transition-colors`}
                >
                  {waitlistState.data.User.BumpCount * 5} $LLAMA
                </span>
              </p>
            </div>
          )}
        </p>
      )}
      {waitlistState.data.User !== undefined && !canEnter && (
        <p className="text-sm max-w-2xl">
          Your account has been flagged!
          <br />
          Please visit the{" "}
          <a href="https://discord.gg/Zu2aP9qghc" className=" text-purple-300">
            Llama Land Channel
          </a>{" "}
          in the AO Discord for help.
        </p>
      )}
      {waitlistState.data.User === undefined ? (
        <Button
          onClick={() => waitlistRegister.mutate()}
          disabled={
            !canRegister ||
            waitlistRegister.isPending ||
            waitlistRegister.isSuccess
          }
          size={"lg"}
          className="px-8 py-6 z-20 bg-gradient-to-r from-[#d47deb] via-[#e570ac] to-[#cb559e] hover:via-[#EBAEC6] hover:to-[#cb559e]"
        >
          {canRegister ? "Sign me up!" : "Sign up later..."}
        </Button>
      ) : canBump && !isClaimed ? (
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
            <TooltipTrigger className="cursor-wait">
              <Button
                onClick={onEnter}
                disabled={!canEnter}
                size={"lg"}
                className={`px-8 py-6 z-20 ${canEnter ? "bg-gradient-to-r from-[#d47deb] via-[#e570ac] to-[#cb559e] hover:via-[#EBAEC6] hover:to-[#cb559e]" : "bg-indigo-950/80"} ${canEnter && !isClaimed ? "animate-bounce" : ""}`}
              >
                {isClaimed ? "Enter Llama Land" : "Claim $LLAMA and Enter!"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="opacity-50">
              <TooltipArrow />
              <div className={`text-xs bg-black px-2 py-1 rounded-md`}>
                {canEnter ? "Let's go!!!" : "Coming soon!"}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
