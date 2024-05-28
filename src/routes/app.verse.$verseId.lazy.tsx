import AnonymousLoader from '@/features/ao/test/components/AnonymousLoader'
import { ArweaveId } from '@/features/arweave/lib/model'
import { Renderer } from '@/features/render/components/Renderer'
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient'
import { createLazyFileRoute, useParams } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/app/verse/$verseId')({
  component: VerseId,
})

function VerseId() {
  const { verseId } = useParams({
    // Not sure why I have to do this but whatever
    select: (params) => ({ 
      verseId: Object.prototype.hasOwnProperty.call(params, 'verseId')
        ? String((params as Record<"verseId", string>).verseId)
        : undefined,
    }),
    strict: false,
  })

  const isValidProcessId = ArweaveId.safeParse(verseId).success;

  if (!isValidProcessId) {
    return (
      <div className="p-2">
        <h3>Invalid process ID</h3>
      </div>
    )
  }

  return (
    <AnonymousLoader>
      {(wallet) => (
        <Renderer
          verseClientForProcess={createVerseClientForProcess(wallet)}
          initialVerseId={verseId}
        />
      )}
    </AnonymousLoader>
  )
}