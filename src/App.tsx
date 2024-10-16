import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query";
import { GameStateProvider } from "@/context/GameStateContext"; // Import the GameStateProvider

const hashHistory = createHashHistory();

const router = createRouter({ routeTree, history: hashHistory });
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <GameStateProvider> {/* Wrap the components inside GameStateProvider */}
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </GameStateProvider>
  );
}
