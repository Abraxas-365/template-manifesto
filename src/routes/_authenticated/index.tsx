import { createFileRoute } from "@tanstack/react-router";
import { FileText, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
  staticData: { breadcrumb: "Dashboard" },
});

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`flex size-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-card-foreground">
        {value}
      </p>
    </div>
  );
}

function HomePage() {
  const { user, tenant } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.name || user?.email}
        </h2>
        {tenant && (
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant.company_name}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Policies"
          value="--"
          icon={FileText}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Compliant"
          value="--"
          icon={ShieldCheck}
          accent="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          label="Pending Review"
          value="--"
          icon={Clock}
          accent="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          label="Needs Attention"
          value="--"
          icon={AlertTriangle}
          accent="bg-red-500/10 text-red-600"
        />
      </div>
    </div>
  );
}
