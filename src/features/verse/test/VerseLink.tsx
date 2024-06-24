import { useQuery } from "@tanstack/react-query";
import { VerseClient } from "../contract/verseClient";
import { Button } from "@/components/ui/button";

interface VerseLinkProps {
  verseId: string;
  verseClient: VerseClient;
  onClick?: () => void;
}

export default function VerseLink({
  verseId,
  verseClient,
  onClick,
}: VerseLinkProps) {
  const verseInfo = useQuery({
    queryKey: ["verseInfo", verseId],
    queryFn: async () => verseClient.readInfo(),
  });

  return (
    <Button onClick={onClick}>Warp to {verseInfo.data?.Name ?? "..."}</Button>
  );
}
