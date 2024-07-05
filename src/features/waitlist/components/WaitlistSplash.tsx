import { AoWallet } from "@/features/ao/lib/aoWallet";
import { LoginMenu } from "./LoginMenu";
import { useMachine } from "@xstate/react";

import { Button } from "@/components/ui/button";
import { inspect } from "@/lib/xstate";
import { loginMachine } from "@/features/login/machines/loginMachine";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface LoginProps {
  children: (wallet: AoWallet, disconnect: () => void) => React.ReactNode;
  loginTitle?: string;
  temporaryWalletEnabled?: boolean;
}

export function WaitlistSplash({
  children,
  loginTitle,
  temporaryWalletEnabled,
}: LoginProps) {
  const [current, send] = useMachine(loginMachine, { inspect });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  useEffect(() => {
    if (audioRef.current === null) {
      return;
    }
    audioRef.current.volume = 0.5;
    if (musicPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [musicPlaying]);

  if (current.matches({ "Logging In": "Show Login UI" })) {
    return (
      <>
        <div className="w-[100%] h-[100%] flex flex-col items-center justify-center bg-indigo-950/80 text-white/90 overflow-hidden">
          <video
            src="assets/video.webm"
            className=" object-cover opacity-15 fixed top-0 left-0 right-0 bottom-0 w-[177.77777778vh] min-w-full h-[56.25vw] min-h-full bg-cover"
            autoPlay
            muted
            loop
          />
          <div className="absolute top-2 right-2 z-20 text-right">
            <Button
              className=""
              onClick={() => setMusicPlaying(!musicPlaying)}
              variant={"ghost"}
            >
              {musicPlaying ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>
          <div className="z-20 h-[380px] flex flex-col items-center justify-start gap-1">
            <img
              src="assets/branding/LLAMA_coin_large.png"
              height={120}
              width={120}
            ></img>
            <img src="assets/branding/LLAMA_purple.png" width={500}></img>
          </div>
          <LoginMenu
            onConnect={(wallet, disconnect) =>
              send({
                type: "Connect",
                data: { wallet, disconnect: disconnect ?? (() => {}) },
              })
            }
            onDisconnect={() => send({ type: "External Disconnect" })}
            localWallet={current.context.localWallet}
            loginTitle={loginTitle}
            temporaryWalletEnabled={temporaryWalletEnabled}
          />
          <div className="h-[10%]" />
        </div>
        <audio
          ref={audioRef}
          className="hidden"
          src="assets/serenade.webm"
          loop
        />
      </>
    );
  }

  if (current.matches("Logged In")) {
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
