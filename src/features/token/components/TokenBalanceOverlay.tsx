import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createTokenClient } from "../contract/tokenClient";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";
import { SchemaFormLoader } from "@/features/schema/components/SchemaFormLoader";

interface TokenBalanceOverlayProps {
  aoContractClientForProcess: AoContractClientForProcess;
  userAddress: string;
  tokenId: string;
  schemaFormProcessId?: string;
  schemaFormMethod?: string;
}

export const TokenBalanceOverlay = ({
  aoContractClientForProcess,
  userAddress,
  tokenId,
  schemaFormProcessId,
  schemaFormMethod,
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
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const [showDetails, setShowDetails] = useState(false);
  const [virtualClickTime, setVirtualClickTime] = useState(0);

  if (!tokenInfo.isSuccess || !tokenBalance.isSuccess) {
    return null;
  }

  const enableSchemaForm = schemaFormProcessId && schemaFormMethod;

  return (
    <Card className="m-4 p-2 rounded-lg bg-opacity-50">
      <CardContent
        className={`flex flex-row items-center  py-0 px-1 ${
          tokenBalance.isFetching
            ? "animate-pulse cursor-wait"
            : "cursor-pointer"
        }`}
      >
        <div
          className="flex flex-row items-center gap-2"
          onClick={() => tokenBalance.refetch()}
        >
          <a href={`https://www.ao.link/#/token/${tokenId}`} target="_blank">
            <img
              className="rounded-full w-8 h-8"
              src={fetchUrl(tokenInfo.data?.Logo ?? "TODO")}
              alt={tokenInfo.data?.Name}
            />
          </a>
          <span className="font-bold">
            {(tokenBalance.data / 10 ** tokenInfo.data.Denomination).toFixed(
              Math.min(tokenInfo.data.Denomination, 2),
            )}{" "}
          </span>
          <span className="font-mono text-sm">${tokenInfo.data.Ticker}</span>
        </div>
        {enableSchemaForm && (
          <Button
            variant={"ghost"}
            size={"icon"}
            className="hover:bg-white/10"
            onClick={() =>
              setShowDetails((x) => {
                const nx = !x;
                if (nx) {
                  setVirtualClickTime((x) => x + 1);
                }
                return nx;
              })
            }
          >
            {showDetails ? <MinusIcon className="" /> : <PlusIcon />}
          </Button>
        )}
      </CardContent>
      {enableSchemaForm && (
        <CardFooter
          className={`max-w-md ${showDetails ? "py-2" : "py-0 h-0 hidden"}`}
        >
          <SchemaFormLoader
            clickTime={virtualClickTime}
            aoContractClientForProcess={aoContractClientForProcess}
            schemaProcessId={schemaFormProcessId}
            methodName={schemaFormMethod}
            isExternal={false}
          />
        </CardFooter>
      )}
    </Card>
  );
};
