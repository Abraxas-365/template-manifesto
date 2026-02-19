import { useEffect, useState } from "react";
import { z } from "zod/v4";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInvitation } from "@/domains/invitations/hooks";
import { useScopeTemplates } from "@/domains/users/hooks";

const emailSchema = z.string().email("Please enter a valid email address");

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [template, setTemplate] = useState("");
  const [emailError, setEmailError] = useState("");

  const createInvitation = useCreateInvitation();
  const { data: templatesData } = useScopeTemplates();

  useEffect(() => {
    if (open) {
      setEmail("");
      setTemplate("");
      setEmailError("");
    }
  }, [open]);

  const templates = templatesData?.templates ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    createInvitation.mutate(
      {
        body: {
          email,
          scope_template: template || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Invitation sent", {
            description: `Invitation sent to ${email}`,
          });
          setEmail("");
          setTemplate("");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error("Failed to send invitation", {
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
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="invite-role">
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
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
