import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, FolderPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateProject } from "@/domains/projects/hooks";
import type { CreateProjectRequest } from "@/domains/projects/types";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();

  const form = useForm<CreateProjectRequest>({
    defaultValues: {
      name: "",
      description: "",
      system_prompt: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createProject.mutateAsync({ body: data });
      toast.success("Project created");
      setOpen(false);
      form.reset();
    } catch {
      // global error handler shows toast
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <FolderPlus className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Set up a new project for your organization
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. ISO 27001 Compliance Project"
              {...form.register("name", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the scope and purpose of this project..."
              {...form.register("description")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="system_prompt">Custom Instructions</Label>
            <Textarea
              id="system_prompt"
              placeholder="Custom instructions for the AI editor..."
              rows={4}
              {...form.register("system_prompt")}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
