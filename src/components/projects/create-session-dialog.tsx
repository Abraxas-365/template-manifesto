import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
          <Plus className="mr-2 size-4" />
          New Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              placeholder="My document"
              {...form.register("name", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="doc-title">Document Title</Label>
            <Input
              id="doc-title"
              placeholder="Document title"
              {...form.register("title")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="doc-content">Initial Content</Label>
            <Textarea
              id="doc-content"
              placeholder="Start writing or leave blank..."
              rows={6}
              {...form.register("content")}
            />
          </div>
          <Button type="submit" disabled={createSession.isPending}>
            {createSession.isPending ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
