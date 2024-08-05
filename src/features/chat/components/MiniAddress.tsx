import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { useState } from "react";

interface MiniAddressProps {
  address: string;
}

export function MiniAddress({ address }: MiniAddressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyEnabled, setCopyEnabled] = useState(true);
  const [justCopied, setJustCopied] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip
        onOpenChange={
          copyEnabled
            ? (newIsOpen) => setIsOpen(newIsOpen || justCopied)
            : undefined
        }
        open={isOpen}
        disableHoverableContent
      >
        <TooltipTrigger asChild>
          <p
            className="m-0 ml-auto p-0 hover:underline cursor-default"
            onClick={() => {
              navigator.clipboard.writeText(address);
              setJustCopied(true);
              setCopyEnabled(false);
              setTimeout(() => {
                setIsOpen(true);
              }, 0);

              setTimeout(() => {
                setIsOpen(false);
                setJustCopied(false);
              }, 2000);

              setTimeout(() => {
                setCopyEnabled(true);
              }, 2500);
            }}
          >
            {truncateAddress(address)}
          </p>
        </TooltipTrigger>
        <TooltipContent>
          <p>{justCopied || !copyEnabled ? "Copied!" : "Click to copy"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
