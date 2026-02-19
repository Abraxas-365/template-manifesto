import { useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { api } from "@/domains";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, AppHeader } from "@/components/layout";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import { RouteErrorFallback } from "@/components/route-error-fallback";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.ensureQueryData(api.auth.me.$queryOptions());
    } catch {
      throw redirect({
        to: "/auth",
        search: { redirect: location.pathname },
      });
    }
  },
  pendingComponent: AuthLoadingScreen,
  errorComponent: RouteErrorFallback,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const oauthRedirect = sessionStorage.getItem("oauth_redirect");
    if (oauthRedirect) {
      sessionStorage.removeItem("oauth_redirect");
      void navigate({ to: oauthRedirect });
    }
  }, [navigate]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
