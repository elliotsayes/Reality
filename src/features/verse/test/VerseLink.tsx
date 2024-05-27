import { useSuspenseQuery } from "@tanstack/react-query"
import { VerseClient } from "../contract/verseClient";
import { Button } from "@/components/ui/button";

interface VerseLinkProps {
  verseId: string;
  verseClient: VerseClient;
  onClick?: () => void;
}

export default function VerseLink({ verseId, verseClient, onClick }: VerseLinkProps) {
  const verseInfo = useSuspenseQuery({
    queryKey: ["verseInfo", verseId],
    queryFn: async () => verseClient.readInfo(),
  })

  return (
    <Button onClick={onClick}>Switch to {verseInfo.data.Name}</Button>
  )
}
