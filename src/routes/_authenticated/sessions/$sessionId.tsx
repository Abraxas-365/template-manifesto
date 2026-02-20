import { createFileRoute } from "@tanstack/react-router";
import { SessionEditorPage } from "@/components/sessions/session-editor-page";

interface SessionSearchParams {
  fromPolicyId?: string;
}

export const Route = createFileRoute(
  "/_authenticated/sessions/$sessionId",
)({
  component: SessionEditorPage,
  staticData: { breadcrumb: "Editor" },
  validateSearch: (search: Record<string, unknown>): SessionSearchParams => ({
    fromPolicyId: typeof search.fromPolicyId === "string" ? search.fromPolicyId : undefined,
  }),
});
