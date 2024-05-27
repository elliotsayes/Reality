import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query";
import { Renderer } from "./features/render/components/Renderer";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Renderer />
    </QueryClientProvider>
  )
}
