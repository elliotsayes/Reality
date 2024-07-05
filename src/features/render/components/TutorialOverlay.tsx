import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FormOverlayProps {
  close: () => void;
}

export default function TutorialOverlay({ close }: FormOverlayProps) {
  const [page, setPage] = useState(0);

  return (
    <QueryClientProvider client={queryClient}>
      <Card>
        <CardHeader className="flex flex-row justify-between items-baseline">
          <CardTitle>Tutorial</CardTitle>
          <Button onClick={close} variant={"destructive"} size={"sm"}>
            <X />
          </Button>
        </CardHeader>
        <CardContent>Tutorial Content</CardContent>
      </Card>
    </QueryClientProvider>
  );
}
