import { AoWallet } from "@/features/ao/lib/aoWallet";
import { WaitlistDetails } from "./WaitlistDetails";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2 } from "lucide-react";

interface WaitlistScreenProps {
  wallet: AoWallet;
}

export function WaitlistScreen({
  wallet,
}: WaitlistScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicPlaying, setMusicPlaying] = useState(true);
  useEffect(() => {
    if (audioRef.current === null) {
      return;
    }
    if (musicPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [musicPlaying]);

  useEffect(() => {
    if (audioRef.current === null) {
      return;
    }
    audioRef.current.volume = 0.5;
  }, []);

  return (
    <>
    <div className="w-[100%] h-[100%] flex flex-col items-center justify-center bg-indigo-950/80 text-white/90 overflow-hidden">
      <video
        src="assets/video.webm"
        className=" object-cover opacity-15 fixed top-0 left-0 right-0 bottom-0 w-[177.77777778vh] min-w-full h-[56.25vw] min-h-full bg-cover"
        autoPlay muted loop
      />
      <Button
        className="absolute top-2 right-2 z-20"
        onClick={() => setMusicPlaying(!musicPlaying)}
        variant={"ghost"}
      >
        {
          musicPlaying ? <Volume2 /> : <VolumeX />
        }
      </Button>
      <div className="z-20 h-[380px] flex flex-col items-center justify-start gap-1">
        <img src="assets/branding/LLAMA_coin_large.png" height={120} width={120}></img>
        <img src="assets/branding/LLAMA_purple.png" width={500}></img>
      </div>
      <Suspense fallback={(
        <div className="flex flex-col justify-center h-72 min-h-44">
          <p>Loading...</p>
        </div>
      )}>
        <WaitlistDetails wallet={wallet} />
      </Suspense>
      <div className="h-[10%]" />
      
    </div>
    <audio
      ref={audioRef}
      className="hidden"
      src="assets/serenade.wav" 
      loop
    />
    </>
  )
}
