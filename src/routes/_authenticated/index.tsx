import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
  staticData: { breadcrumb: "Home" },
});

function HomePage() {
  const { user, tenant } = useAuth();

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl font-bold tracking-tight">
        Welcome, {user?.name || user?.email}
      </h2>
      {tenant && <p className="text-muted-foreground">{tenant.company_name}</p>}
    </div>
  );
}
