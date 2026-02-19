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
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the role for{" "}
            <span className="font-medium">{user?.name || user?.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
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
