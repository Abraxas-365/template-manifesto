import { createFileRoute } from "@tanstack/react-router";
import { ProjectForm } from "@/components/projects/project-form";

function NewProjectPage() {
  return <ProjectForm mode="create" />;
}

export const Route = createFileRoute("/_authenticated/projects/new")({
  component: NewProjectPage,
  staticData: { breadcrumb: "New Project" },
});
