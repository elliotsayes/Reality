import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query";
import VerseNavAnonymous from "./features/verse/test/VerseNav";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VerseNavAnonymous />
    </QueryClientProvider>
  )
}
