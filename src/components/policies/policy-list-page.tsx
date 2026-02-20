import { Link, useSearch } from "@tanstack/react-router";
import {
  ShieldAlert,
  MoreHorizontal,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolicies, usePoliciesByProject, useDeletePolicy } from "@/domains/policies/hooks";
import { PolicyStatusBadge } from "./policy-status-badge";

export function PolicyListPage() {
  const { projectId } = useSearch({ from: "/_authenticated/policies/" });
  const allPolicies = usePolicies();
  const projectPolicies = usePoliciesByProject(projectId ?? "");
  const { data, isLoading } = projectId ? projectPolicies : allPolicies;
  const deletePolicy = useDeletePolicy();

  const handleDelete = async (id: string) => {
    try {
      await deletePolicy.mutateAsync({ path: { id } });
      toast.success("Policy deleted");
    } catch {
      // global error handler
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Policies</h2>
        <p className="text-muted-foreground">
          ISO 27001 policy documents for your organization
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card py-16">
          <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
            <ShieldAlert className="text-muted-foreground size-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No policies yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Generate a policy from a session to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((policy) => (
            <Card
              key={policy.id}
              className="group relative transition-all hover:shadow-md hover:border-border/80"
            >
              <div className="absolute top-3 right-3 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        to="/policies/$policyId"
                        params={{ policyId: policy.id }}
                      >
                        <Eye className="size-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    {policy.metadata.status === "draft" && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(policy.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link
                to="/policies/$policyId"
                params={{ policyId: policy.id }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <ShieldAlert className="size-4 text-amber-600" />
                    </div>
                    <span className="truncate">{policy.title}</span>
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-2 pl-10">
                    <div className="flex items-center gap-2">
                      <PolicyStatusBadge status={policy.metadata.status} />
                      <span className="text-xs text-muted-foreground">
                        {policy.metadata.document_id}
                      </span>
                    </div>
                    {policy.metadata.iso_controls.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {policy.metadata.iso_controls.slice(0, 3).map((ctrl) => (
                          <Badge
                            key={ctrl.code}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {ctrl.code}
                          </Badge>
                        ))}
                        {policy.metadata.iso_controls.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{policy.metadata.iso_controls.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
