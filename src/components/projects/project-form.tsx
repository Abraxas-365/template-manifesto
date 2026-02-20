import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Wrench,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateProject,
  useUpdateProject,
  useAttachKB,
  useDetachKB,
} from "@/domains/projects/hooks";
import { useKnowledgeBases } from "@/domains/kbs/hooks";
import type { ProjectDTO, CreateProjectRequest } from "@/domains/projects/types";

// ── Tool metadata ────────────────────────────────────────────────────────────

interface ToolInfo {
  id: string;
  label: string;
  description: string;
  category: "read" | "edit" | "search";
}

const AVAILABLE_TOOLS: ToolInfo[] = [
  {
    id: "document_read",
    label: "Read Document",
    description: "Read the full current content of the document",
    category: "read",
  },
  {
    id: "document_get_structure",
    label: "Get Structure",
    description: "Get the document outline with headings and line numbers",
    category: "read",
  },
  {
    id: "document_search",
    label: "Search Document",
    description: "Search for text within the document with context",
    category: "search",
  },
  {
    id: "document_str_replace",
    label: "Find & Replace",
    description: "Replace exact text strings in the document",
    category: "edit",
  },
  {
    id: "document_replace_section",
    label: "Replace Section",
    description: "Replace a full markdown section by heading",
    category: "edit",
  },
  {
    id: "document_create_section",
    label: "Create Section",
    description: "Create a new markdown section at a specified position",
    category: "edit",
  },
  {
    id: "document_delete_section",
    label: "Delete Section",
    description: "Delete an entire markdown section by heading",
    category: "edit",
  },
  {
    id: "document_insert_at",
    label: "Insert At",
    description: "Insert content before or after a specific anchor text",
    category: "edit",
  },
  {
    id: "document_append",
    label: "Append",
    description: "Append content to the end of the document",
    category: "edit",
  },
  {
    id: "document_prepend",
    label: "Prepend",
    description: "Prepend content to the beginning of the document",
    category: "edit",
  },
  {
    id: "document_undo",
    label: "Undo",
    description: "Undo the last document edit",
    category: "edit",
  },
  {
    id: "kb_search",
    label: "Knowledge Base Search",
    description: "Search the attached knowledge base for reference material",
    category: "search",
  },
];

const TOOL_CATEGORIES = [
  { key: "read" as const, label: "Reading" },
  { key: "edit" as const, label: "Editing" },
  { key: "search" as const, label: "Search" },
];

const ALL_TOOL_IDS = AVAILABLE_TOOLS.map((t) => t.id);

// ── Form data ────────────────────────────────────────────────────────────────

interface ProjectFormData {
  name: string;
  description: string;
  system_prompt: string;
  enabled_tools: string[];
  kb_id: string; // "" means none
}

// ── Component ────────────────────────────────────────────────────────────────

interface ProjectFormProps {
  project?: ProjectDTO;
  mode: "create" | "edit";
}

export function ProjectForm({ project, mode }: ProjectFormProps) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const attachKB = useAttachKB();
  const detachKB = useDetachKB();
  const { data: kbs } = useKnowledgeBases(1, 100);

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      system_prompt: project?.system_prompt ?? "",
      enabled_tools: project?.enabled_tools ?? ALL_TOOL_IDS,
      kb_id: project?.kb_id ?? "",
    },
  });

  const enabledTools = form.watch("enabled_tools");
  const selectedKBId = form.watch("kb_id");

  const toggleTool = (toolId: string) => {
    const current = form.getValues("enabled_tools");
    if (current.includes(toolId)) {
      form.setValue(
        "enabled_tools",
        current.filter((t) => t !== toolId),
        { shouldDirty: true },
      );
    } else {
      form.setValue("enabled_tools", [...current, toolId], {
        shouldDirty: true,
      });
    }
  };

  const selectAll = () => {
    form.setValue("enabled_tools", ALL_TOOL_IDS, { shouldDirty: true });
  };

  const deselectAll = () => {
    form.setValue("enabled_tools", [], { shouldDirty: true });
  };

  const isPending =
    createProject.isPending ||
    updateProject.isPending ||
    attachKB.isPending ||
    detachKB.isPending;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (mode === "create") {
        const body: CreateProjectRequest = {
          name: data.name,
          description: data.description || undefined,
          system_prompt: data.system_prompt || undefined,
          enabled_tools: data.enabled_tools,
        };
        const created = await createProject.mutateAsync({ body });

        // Attach KB if selected
        if (data.kb_id) {
          await attachKB.mutateAsync({
            path: { id: created.id },
            body: { kb_id: data.kb_id },
          });
        }

        toast.success("Project created");
        await navigate({
          to: "/projects/$projectId",
          params: { projectId: created.id },
        });
      } else if (project) {
        await updateProject.mutateAsync({
          path: { id: project.id },
          body: {
            name: data.name,
            description: data.description,
            system_prompt: data.system_prompt,
            enabled_tools: data.enabled_tools,
          },
        });

        // Handle KB changes
        const hadKB = !!project.kb_id;
        const wantsKB = !!data.kb_id;

        if (wantsKB && data.kb_id !== project.kb_id) {
          await attachKB.mutateAsync({
            path: { id: project.id },
            body: { kb_id: data.kb_id },
          });
        } else if (hadKB && !wantsKB) {
          await detachKB.mutateAsync({ path: { id: project.id } });
        }

        toast.success("Project updated");
        await navigate({
          to: "/projects/$projectId",
          params: { projectId: project.id },
        });
      }
    } catch {
      // global error handler shows toast
    }
  });

  const selectedKB = kbs?.items?.find((kb) => kb.id === selectedKBId);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            project
              ? navigate({
                  to: "/projects/$projectId",
                  params: { projectId: project.id },
                })
              : navigate({ to: "/projects" })
          }
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          {mode === "create" ? "Create Project" : "Project Settings"}
        </h2>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        {/* ── General ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">General</h3>
            <p className="text-sm text-muted-foreground">
              Basic project information
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My project"
              {...form.register("name", { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this project about?"
              rows={2}
              {...form.register("description")}
            />
          </div>
        </section>

        <Separator />

        {/* ── Custom Instructions ─────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">Custom Instructions</h3>
            <p className="text-sm text-muted-foreground">
              System prompt that guides the AI editor's behavior for all sessions
              in this project
            </p>
          </div>

          <Textarea
            id="system_prompt"
            placeholder="You are an expert document editor specializing in..."
            rows={5}
            className="font-mono text-sm"
            {...form.register("system_prompt")}
          />
        </section>

        <Separator />

        {/* ── Knowledge Base ──────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Knowledge Base</h3>
              <p className="text-sm text-muted-foreground">
                Attach a knowledge base to give the editor reference material
              </p>
            </div>
          </div>

          <Controller
            name="kb_id"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-3">
                <Select
                  value={field.value || "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No knowledge base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No knowledge base</SelectItem>
                    {kbs?.items?.map((kb) => (
                      <SelectItem key={kb.id} value={kb.id}>
                        {kb.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedKB && (
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{selectedKB.name}</p>
                        {selectedKB.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedKB.description}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => field.onChange("")}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedKB.sources.length} source
                        {selectedKB.sources.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Top {selectedKB.retrieval_top_k} results
                      </Badge>
                    </div>
                  </div>
                )}

                {!kbs?.items?.length && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="size-4" />
                    <span>
                      No knowledge bases available.{" "}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={() => navigate({ to: "/kbs" })}
                      >
                        Create one
                      </Button>
                    </span>
                  </div>
                )}
              </div>
            )}
          />
        </section>

        <Separator />

        {/* ── Tools ───────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Enabled Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which editing tools the AI can use in this project
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
              >
                All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deselectAll}
              >
                None
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {enabledTools.length} of {ALL_TOOL_IDS.length} tools enabled
          </div>

          {TOOL_CATEGORIES.map((cat) => {
            const tools = AVAILABLE_TOOLS.filter((t) => t.category === cat.key);
            return (
              <div key={cat.key} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {cat.label}
                </p>
                <div className="rounded-lg border divide-y">
                  {tools.map((tool) => {
                    const enabled = enabledTools.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleTool(tool.id)}
                      >
                        <div className="flex flex-col gap-0.5 pr-4">
                          <span className="text-sm font-medium">
                            {tool.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tool.description}
                          </span>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => toggleTool(tool.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        <Separator />

        {/* ── Submit ──────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              project
                ? navigate({
                    to: "/projects/$projectId",
                    params: { projectId: project.id },
                  })
                : navigate({ to: "/projects" })
            }
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create Project"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
