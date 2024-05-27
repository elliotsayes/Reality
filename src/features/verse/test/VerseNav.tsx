import { AoWallet } from "@/features/ao/lib/aoWallet";
import AnonymousLoader from "@/features/ao/test/components/AnonymousLoader";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { createVerseClientForProcess } from "../contract/verseClient";
import VerseLink from "./VerseLink";

interface VerseNavProps {
  wallet: AoWallet;
}

function VerseNav({ wallet }: VerseNavProps) {
  const [processId, setProcessId] = useState<string>(import.meta.env.VITE_UNIVERSE_PROCESS_ID)
  
  const verseClientBuilder = createVerseClientForProcess(wallet);
  const verseClient = verseClientBuilder(processId);

  const info = useSuspenseQuery(
    {
      queryKey: [processId, "verseInfo"],
      queryFn: async () => verseClient.readInfo(),
    },
  )

  const params = useSuspenseQuery(
    {
      queryKey: [processId, "verseParameters"],
      queryFn: async () => verseClient.readParameters(),
    },
  )

  const entities = useSuspenseQuery(
    {
      queryKey: [processId, "verseEntities"],
      queryFn: async () => verseClient.readAllEntities(),
    },
  )

  return (
    <div>
      <h1>Verse: {processId}</h1>
      <h2>Info</h2>
      <pre className="text-sm">{JSON.stringify(info.data, null, 2)}</pre>
      <h2>Parameters</h2>
      <pre className="text-xs max-h-32 overflow-y-scroll">{JSON.stringify(params.data, null, 2)}</pre>
      <h2>Entities</h2>
      <pre className="text-xs max-h-32 overflow-y-scroll">{JSON.stringify(entities.data, null, 2)}</pre>
      <div className="flex flex-col items-start gap-2 py-2">
        {
          Object.keys(entities.data)
            .filter((entityId) => entities.data[entityId].Type === "Warp")
            .map((verseId) => (
              <VerseLink
                key={`${processId}-${verseId}`}
                verseId={verseId}
                verseClient={verseClientBuilder(verseId)}
                onClick={() => setProcessId(verseId)}
              />
            ))
        }
      </div>
    </div>
  )
}

export default function VerseNavAnonymous() {
  return (
    <AnonymousLoader>
      {(wallet) => (
        <Suspense fallback={<div>Loading...</div>}>
          <VerseNav wallet={wallet} />
        </Suspense>
      )}
    </AnonymousLoader>
  )
}
