import { Badge } from "@/components/ui/badge";
import type { PolicyStatus } from "@/domains/policies/types";

const statusConfig: Record<
  PolicyStatus,
  { label: string; variant: "warning" | "info" | "success" | "secondary" }
> = {
  draft: { label: "Draft", variant: "warning" },
  review: { label: "In Review", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  retired: { label: "Retired", variant: "secondary" },
};

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
