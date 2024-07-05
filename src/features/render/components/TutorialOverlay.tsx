import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Tailwind styles to look like key on the keyboard
function KeyboardKey({ children }: { children: string }) {
  return <kbd className="bg-gray-200 p-1 rounded-md shadow-md">{children}</kbd>;
}

interface FormOverlayProps {
  close: () => void;
}

export default function TutorialOverlay({ close }: FormOverlayProps) {
  const [page, setPage] = useState(0);
  const [doneEnabled, setDoneEnabled] = useState(false);
  const [doneTimeout, setDoneTimeout] = useState<NodeJS.Timeout | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <Card>
        <CardHeader className="flex flex-row justify-between items-baseline">
          <CardTitle>Tutorial</CardTitle>
          <Button
            onClick={() => {
              toast("Tutorial skipped");
              close();
            }}
            variant={"destructive"}
            size={"sm"}
          >
            <X />
          </Button>
        </CardHeader>
        <CardContent className="font-undead-pixel text-lg">
          <div>
            {page === 0 ? (
              // Show arrow keys for movement
              <div className="flex flex-row justify-evenly items-end gap-4 pt-4 pb-10 h-32">
                <div>
                  Arrow keys
                  <br />
                  for movement
                </div>
                <div className="flex flex-col items-center leading-3">
                  <div className="flex flex-row items-center">
                    <KeyboardKey>↑</KeyboardKey>
                  </div>
                  <div className="flex flex-row items-center">
                    <KeyboardKey>←</KeyboardKey> <KeyboardKey>↓</KeyboardKey>{" "}
                    <KeyboardKey>→</KeyboardKey>
                  </div>
                </div>
              </div>
            ) : page === 1 ? (
              <div className="flex flex-row justify-evenly items-center gap-4 pt-4 pb-10 h-32">
                <div>
                  Click on NPCs
                  <br />
                  to interact
                </div>
                <img src="assets/tutorial/click_npc.png" width={100} />
              </div>
            ) : (
              <div className="flex flex-row justify-evenly items-center gap-4 pt-4 pb-10 h-32">
                <div>Find the Llama King and beg him for $LLAMA!</div>
                <img src="assets/tutorial/click_king.png" width={100} />
              </div>
            )}
          </div>
          <div className="flex flex-row justify-between gap-4">
            <Button
              onClick={() => {
                if (doneTimeout) {
                  clearTimeout(doneTimeout);
                }
                setDoneEnabled(false);
                setPage((prev) => Math.max(0, prev - 1));
              }}
              variant={"outline"}
              disabled={page === 0}
            >
              Prev
            </Button>
            {page < 2 ? (
              <Button
                key="next"
                onClick={() => {
                  setDoneEnabled(false);
                  if (page === 1) {
                    setDoneTimeout(
                      setTimeout(() => {
                        setDoneEnabled(true);
                      }, 1000),
                    );
                  }
                  setPage((prev) => prev + 1);
                }}
                variant={"outline"}
              >
                Next
              </Button>
            ) : (
              <Button
                key="done"
                onClick={() => {
                  toast("Tutorial completed!");
                  close();
                }}
                disabled={!doneEnabled}
              >
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </QueryClientProvider>
  );
}
