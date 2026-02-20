import { Link } from "@tanstack/react-router";
import { FolderKanban, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useProjects, useDeleteProject } from "@/domains/projects/hooks";
import { CreateProjectDialog } from "./create-project-dialog";

export function ProjectListPage() {
  const { data, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync({ path: { id } });
      toast.success("Project deleted");
    } catch {
      // global error handler
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your AI editor projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderKanban className="text-muted-foreground mb-4 size-12" />
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first project to get started
          </p>
          <CreateProjectDialog />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((project) => (
            <Card key={project.id} className="group relative">
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="size-5" />
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
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
