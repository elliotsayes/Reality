import AnonymousLoader from '@/features/ao/test/components/AnonymousLoader'
import { Renderer } from '@/features/render/components/Renderer'
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient'
import { queryClient } from '@/lib/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/app/')({
  component: App,
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnonymousLoader>
        {(wallet) => (
          <Renderer verseClientForProcess={createVerseClientForProcess(wallet)} />
        )}
      </AnonymousLoader>
    </QueryClientProvider>
  )
}
