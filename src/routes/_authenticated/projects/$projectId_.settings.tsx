import { createFileRoute, useParams } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectForm } from "@/components/projects/project-form";
import { useProject } from "@/domains/projects/hooks";

function ProjectSettingsPage() {
  const { projectId } = useParams({
    from: "/_authenticated/projects/$projectId_/settings",
  });
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-muted-foreground">Project not found.</p>;
  }

  return <ProjectForm project={project} mode="edit" />;
}

export const Route = createFileRoute(
  "/_authenticated/projects/$projectId_/settings",
)({
  component: ProjectSettingsPage,
  staticData: { breadcrumb: "Settings" },
});
