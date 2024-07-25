import { AoWallet } from "@/features/ao/lib/aoWallet";
import AnonymousLoader from "@/features/ao/test/components/AnonymousLoader";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { createRealityClientForProcess } from "../contract/realityClient";
import RealityLink from "./RealityLink";

interface RealityNavProps {
  wallet: AoWallet;
}

function RealityNav({ wallet }: RealityNavProps) {
  const [processId, setProcessId] = useState<string>(
    import.meta.env.VITE_UNIVERSE_PROCESS_ID,
  );

  const realityClientBuilder = createRealityClientForProcess(wallet);
  const realityClient = realityClientBuilder(processId);

  const info = useSuspenseQuery({
    queryKey: [processId, "realityInfo"],
    queryFn: async () => realityClient.readInfo(),
  });

  const params = useSuspenseQuery({
    queryKey: [processId, "realityParameters"],
    queryFn: async () => realityClient.readParameters(),
  });

  const entities = useSuspenseQuery({
    queryKey: [processId, "realityEntities"],
    queryFn: async () => realityClient.readEntitiesStatic(),
  });

  return (
    <div>
      <h1>Reality: {processId}</h1>
      <h2>Info</h2>
      <pre className="text-sm">{JSON.stringify(info.data, null, 2)}</pre>
      <h2>Parameters</h2>
      <pre className="text-xs max-h-32 overflow-y-scroll">
        {JSON.stringify(params.data, null, 2)}
      </pre>
      <h2>Entities</h2>
      <pre className="text-xs max-h-32 overflow-y-scroll">
        {JSON.stringify(entities.data, null, 2)}
      </pre>
      <div className="flex flex-col items-start gap-2 py-2">
        {Object.keys(entities.data)
          .filter(
            (entityId) => entities.data[entityId].Interaction?.Type === "Warp",
          )
          .map((worldId) => (
            <RealityLink
              key={`${processId}-${worldId}`}
              worldId={worldId}
              realityClient={realityClientBuilder(worldId)}
              onClick={() => setProcessId(worldId)}
            />
          ))}
      </div>
    </div>
  );
}

export default function RealityNavAnonymous() {
  return (
    <AnonymousLoader>
      {(wallet) => (
        <Suspense fallback={<div>Loading...</div>}>
          <RealityNav wallet={wallet} />
        </Suspense>
      )}
    </AnonymousLoader>
  );
}
