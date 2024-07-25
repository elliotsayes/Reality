import { useQuery } from "@tanstack/react-query";
import { RealityClient } from "../contract/realityClient";
import { Button } from "@/components/ui/button";

interface RealityLinkProps {
  worldId: string;
  realityClient: RealityClient;
  onClick?: () => void;
}

export default function RealityLink({
  worldId,
  realityClient,
  onClick,
}: RealityLinkProps) {
  const realityInfo = useQuery({
    queryKey: ["realityInfo", worldId],
    queryFn: async () => realityClient.readInfo(),
  });

  return (
    <Button onClick={onClick}>Warp to {realityInfo.data?.Name ?? "..."}</Button>
  );
}
