import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApplyScopeTemplate,
  useScopeTemplates,
} from "@/domains/users/hooks";
import type { UserDetailsDTO } from "@/domains/users/types";

interface ChangeRoleDialogProps {
  user: UserDetailsDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  const [template, setTemplate] = useState("");

  const applyScopeTemplate = useApplyScopeTemplate();
  const { data: templatesData } = useScopeTemplates();

  useEffect(() => {
    if (open) {
      setTemplate("");
    }
  }, [open]);

  const templates = templatesData?.templates ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !template) return;

    applyScopeTemplate.mutate(
      {
        path: { id: user.id },
        body: { template_name: template },
      },
      {
        onSuccess: () => {
          toast.success("Role updated", {
            description: `${user.name || user.email}'s role has been updated.`,
          });
          setTemplate("");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error("Failed to update role", {
            description: error.message,
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <svg className="size-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <div>
              <DialogTitle>Change Role</DialogTitle>
              <DialogDescription>
                Update the role for{" "}
                <span className="font-medium">{user?.name || user?.email}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change-role-select">Role Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="change-role-select">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!template || applyScopeTemplate.isPending}
            >
              {applyScopeTemplate.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
