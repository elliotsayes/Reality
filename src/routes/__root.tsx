import { Toaster } from "@/components/ui/sonner";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="bg-brownCustom h-dvh overflow-clip">
      {/* <div className="p-2 flex items-center gap-2 bg-white h-14">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/app" className="[&.active]:font-bold">
          Game
        </Link>
      </div>
      <hr /> */}
      <Outlet />
      <Toaster position="bottom-left" />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </>
      )}
    </div>
  ),
});
