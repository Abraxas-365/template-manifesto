import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/components/projects/project-detail-page";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectDetailPage,
  staticData: { breadcrumb: "Project" },
});
