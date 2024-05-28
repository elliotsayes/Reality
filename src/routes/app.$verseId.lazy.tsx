import AnonymousLoader from '@/features/ao/test/components/AnonymousLoader'
import { ArweaveId } from '@/features/arweave/lib/model'
import { Renderer } from '@/features/render/components/Renderer'
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient'
import { queryClient } from '@/lib/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createLazyFileRoute, useParams } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/app/$verseId')({
  component: VerseId,
})

function VerseId() {
  const { verseId } = useParams({})

  const isValidProcessId = ArweaveId.safeParse(verseId).success;

  if (!isValidProcessId) {
    return (
      <div className="p-2">
        <h3>Invalid process ID</h3>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AnonymousLoader>
        {(wallet) => (
          <Renderer
            verseClientForProcess={createVerseClientForProcess(wallet)}
            initialVerseId={verseId}
          />
        )}
      </AnonymousLoader>
    </QueryClientProvider>
  )
}
