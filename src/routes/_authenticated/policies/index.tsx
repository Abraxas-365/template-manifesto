import { createFileRoute } from "@tanstack/react-router";
import { PolicyListPage } from "@/components/policies/policy-list-page";

interface PolicySearchParams {
  projectId?: string;
}

export const Route = createFileRoute("/_authenticated/policies/")({
  component: PolicyListPage,
  validateSearch: (search: Record<string, unknown>): PolicySearchParams => ({
    projectId: search.projectId as string | undefined,
  }),
  staticData: { breadcrumb: "Policies" },
});
