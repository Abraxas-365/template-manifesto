import { createFileRoute } from "@tanstack/react-router";
import { PolicyDetailPage } from "@/components/policies/policy-detail-page";

export const Route = createFileRoute("/_authenticated/policies/$policyId")({
  component: PolicyDetailPage,
  staticData: { breadcrumb: "Policy Details" },
});
