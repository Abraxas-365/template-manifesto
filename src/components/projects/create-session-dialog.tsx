import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, FileText, Loader2, ShieldAlert } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSession } from "@/domains/sessions/hooks";
import { useApprovedPoliciesByProject } from "@/domains/policies/hooks";

interface FormData {
  name: string;
  title: string;
  content: string;
}

export function CreateSessionDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const createSession = useCreateSession();
  const navigate = useNavigate();
  const { data: approvedPolicies } = useApprovedPoliciesByProject(projectId);

  const form = useForm<FormData>({
    defaultValues: { name: "", title: "", content: "" },
  });

  const handlePolicySelect = (policyId: string) => {
    if (policyId === "none") {
      setSelectedPolicyId("");
      return;
    }
    setSelectedPolicyId(policyId);
    const policy = approvedPolicies.find((p) => p.id === policyId);
    if (policy) {
      if (!form.getValues("name")) {
        form.setValue("name", `${policy.title} - New Version`);
      }
      form.setValue("title", policy.title);
      form.setValue("content", policy.content);
    }
  };

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
      setSelectedPolicyId("");
      await navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: session.id },
        search: selectedPolicyId ? { fromPolicyId: selectedPolicyId } : {},
      });
    } catch {
      // global error handler
    }
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      setSelectedPolicyId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                Start a new document drafting session
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 pt-2">
          {approvedPolicies.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="base-policy">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5" />
                  Base on Approved Policy
                </span>
              </Label>
              <Select
                value={selectedPolicyId || "none"}
                onValueChange={handlePolicySelect}
              >
                <SelectTrigger id="base-policy">
                  <SelectValue placeholder="Start from scratch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Start from scratch</SelectItem>
                  {approvedPolicies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.title} (v{policy.metadata.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select an approved policy to create a new version. The old
                version will be auto-retired when the new one is approved.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              placeholder="e.g. Access Control Draft v2"
              {...form.register("name", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-title">Document Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. Information Security Document"
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
