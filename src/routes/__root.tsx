import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import type { QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/error-boundary";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toaster />
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </AuthProvider>
  );
}
