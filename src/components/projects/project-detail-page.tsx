import { useParams, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  MoreHorizontal,
  Trash2,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useProject } from "@/domains/projects/hooks";
import {
  useSessionsByProject,
  useDeleteSession,
  useArchiveSession,
} from "@/domains/sessions/hooks";
import { CreateSessionDialog } from "./create-session-dialog";

export function ProjectDetailPage() {
  const { projectId } = useParams({
    from: "/_authenticated/projects/$projectId",
  });
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: sessions, isLoading: sessionsLoading } =
    useSessionsByProject(projectId);
  const deleteSession = useDeleteSession();
  const archiveSession = useArchiveSession();

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession.mutateAsync({ path: { id } });
      toast.success("Session deleted");
    } catch {
      // global error handler
    }
  };

  const handleArchiveSession = async (id: string) => {
    try {
      await archiveSession.mutateAsync({ path: { id } });
      toast.success("Session archived");
    } catch {
      // global error handler
    }
  };

  if (projectLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-muted-foreground">Project not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/projects">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{project.llm_config.model}</Badge>
        <Badge variant="outline">{project.editor_config.default_format}</Badge>
        {project.kb_id && <Badge variant="default">KB attached</Badge>}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sessions</h3>
        <CreateSessionDialog projectId={projectId} />
      </div>

      {sessionsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !sessions?.items?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <FileText className="text-muted-foreground mb-4 size-10" />
          <p className="text-muted-foreground mb-4">No sessions yet</p>
          <CreateSessionDialog projectId={projectId} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.items.map((session) => (
            <Card key={session.id} className="group relative">
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
                    {session.status === "active" && (
                      <DropdownMenuItem
                        onClick={() => handleArchiveSession(session.id)}
                      >
                        <Archive className="mr-2 size-4" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link
                to="/sessions/$sessionId"
                params={{ sessionId: session.id }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="size-4" />
                    {session.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge
                      variant={
                        session.status === "active" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {session.status}
                    </Badge>
                    {session.document.title && (
                      <span className="truncate">{session.document.title}</span>
                    )}
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
