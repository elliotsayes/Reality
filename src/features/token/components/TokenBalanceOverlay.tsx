import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createTokenClient } from "../contract/tokenClient";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { Card, CardContent } from "@/components/ui/card";

interface TokenBalanceOverlayProps {
  userAddress: string;
  tokenId: string;
  aoContractClientForProcess: AoContractClientForProcess;
}

export const TokenBalanceOverlay = ({
  userAddress,
  tokenId,
  aoContractClientForProcess,
}: TokenBalanceOverlayProps) => {
  const tokenClient = useMemo(
    () => createTokenClient(aoContractClientForProcess(tokenId)),
    [tokenId, aoContractClientForProcess],
  );

  const tokenInfo = useQuery({
    queryKey: ["token", tokenId, "info"],
    queryFn: async () => tokenClient.getInfo(),
  });
  const tokenBalance = useQuery({
    queryKey: ["token", tokenId, "balance", userAddress],
    queryFn: async () => tokenClient.getBalance(userAddress),
  });

  if (!tokenInfo.isSuccess || !tokenBalance.isSuccess) {
    return null;
  }

  return (
    <Card className="m-4 p-2 rounded-lg bg-opacity-50">
      <CardContent className="flex flex-row items-center gap-2 p-0">
        <a href={`https://www.ao.link/#/token/${tokenId}`} target="_blank">
          <img
            className=" rounded-full w-8 h-8"
            src={fetchUrl(tokenInfo.data?.Logo ?? "TODO")}
            alt={tokenInfo.data?.Name}
          />
        </a>
        <span className="font-bold">
          {(tokenBalance.data / 10 ** tokenInfo.data.Denomination).toFixed(2)}{" "}
        </span>
        <span className="font-mono text-sm">${tokenInfo.data.Ticker}</span>
      </CardContent>
    </Card>
  );
};
