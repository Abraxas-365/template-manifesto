import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, FileText, Loader2 } from "lucide-react";
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
import { useCreateSession } from "@/domains/sessions/hooks";

interface FormData {
  name: string;
  title: string;
  content: string;
}

export function CreateSessionDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const createSession = useCreateSession();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    defaultValues: { name: "", title: "", content: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const session = await createSession.mutateAsync({
        path: { projectId },
        body: {
          name: data.name,
          document: {
            title: data.title || data.name,
            content: data.content,
          },
        },
      });
      toast.success("Session created");
      setOpen(false);
      form.reset();
      await navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: session.id },
      });
    } catch {
      // global error handler
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Session</DialogTitle>
              <DialogDescription>
                Start a new policy drafting session
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              placeholder="e.g. Access Control Policy v2"
              {...form.register("name", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-title">Document Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. Information Security Policy"
              {...form.register("title")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-content">Initial Content</Label>
            <Textarea
              id="doc-content"
              placeholder="Start writing or leave blank to begin from a template..."
              rows={5}
              {...form.register("content")}
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
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {createSession.isPending ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
