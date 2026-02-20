import { createFileRoute } from "@tanstack/react-router";
import { SessionEditorPage } from "@/components/sessions/session-editor-page";

export const Route = createFileRoute(
  "/_authenticated/sessions/$sessionId",
)({
  component: SessionEditorPage,
  staticData: { breadcrumb: "Editor" },
});
