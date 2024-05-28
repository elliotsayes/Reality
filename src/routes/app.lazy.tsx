import { Renderer } from '@/features/render/components/Renderer'
import { queryClient } from '@/lib/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/app')({
  component: App,
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Renderer />
    </QueryClientProvider>
  )
}
