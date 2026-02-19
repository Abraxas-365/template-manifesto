import { createFileRoute } from "@tanstack/react-router";
import { ProjectListPage } from "@/components/projects/project-list-page";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectListPage,
  staticData: { breadcrumb: "Projects" },
});
