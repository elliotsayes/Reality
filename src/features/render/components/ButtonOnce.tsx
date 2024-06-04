import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"
import { ElementSize } from "../lib/model";
import { useState } from "react";

interface ButtonOnceProps {
  elementSize: ElementSize;
  children: React.ReactNode;
  onClick: () => void;
}

export function ButtonOnce({ elementSize, children, onClick }: ButtonOnceProps) {
  const [isClicked, setIsClicked] = useState(false);
  
  return (
    <div className={`w-[${elementSize.w}px] h-[${elementSize.h}px] flex flex-col items-center justify-center`}>
      <Button
        disabled={isClicked}
        className='flex text-xl font-bold'
        onClick={() => {
          setIsClicked(true);
          onClick();
        }}
      >
        {
          isClicked && <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        }
        {children}
      </Button>
    </div>
  )
}
