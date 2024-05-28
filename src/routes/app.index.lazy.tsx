import AnonymousLoader from '@/features/ao/test/components/AnonymousLoader'
import { Renderer } from '@/features/render/components/Renderer'
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/app/')({
  component: App,
})

function App() {
  return (
    <AnonymousLoader>
      {(wallet) => (
        <Renderer verseClientForProcess={createVerseClientForProcess(wallet)} />
      )}
    </AnonymousLoader>
  )
}
