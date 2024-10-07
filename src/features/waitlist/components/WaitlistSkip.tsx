import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

interface WaitlistDetailsProps {
  onEnter: () => void;
}

export function WaitlistSkip({ onEnter }: WaitlistDetailsProps) {
  return (
    <div
      className="flex flex-col justify-evenly items-center h-44 min-h-44 text-center px-4 z-20"
      style={{
        fontFamily: "'Press Start 2P",
      }}
    >
      <p className="text-xl leading-8">
        <span className="bg-gradient-to-r from-[#cb559e] via-[#EBAEC6] to-[#d47deb] inline-block text-transparent bg-clip-text">
          You may now
          <br />
          enter Llama Land!
        </span>
      </p>

      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger className="cursor-wait">
            <Button
              onClick={onEnter}
              size={"lg"}
              className={`px-8 py-6 z-20 bg-gradient-to-r from-[#d47deb] via-[#e570ac] to-[#cb559e] hover:via-[#EBAEC6] hover:to-[#cb559e] animate-bounce`}
            >
              Enter Llama Land
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="opacity-50">
            <TooltipArrow />
            <div className={`text-xs bg-black px-2 py-1 rounded-md`}>
              Let's go!!!
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
