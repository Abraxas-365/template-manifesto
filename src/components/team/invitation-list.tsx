import { useState } from "react";
import { MoreHorizontal, Ban, Trash2, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import type {
  InvitationDTO,
  InvitationStatus,
} from "@/domains/invitations/types";

type ConfirmAction =
  | { type: "revoke"; invitation: InvitationDTO }
  | { type: "delete"; invitation: InvitationDTO };

interface InvitationListProps {
  invitations: InvitationDTO[];
  isLoading: boolean;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
  isMutating: boolean;
}

function getStatusBadge(status: InvitationStatus) {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning">Pending</Badge>;
    case "ACCEPTED":
      return <Badge variant="success">Accepted</Badge>;
    case "EXPIRED":
      return <Badge variant="secondary">Expired</Badge>;
    case "REVOKED":
      return <Badge variant="destructive">Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function InvitationList({
  invitations,
  isLoading,
  onRevoke,
  onDelete,
  isMutating,
}: InvitationListProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mail />
          </EmptyMedia>
          <EmptyTitle>No invitations</EmptyTitle>
          <EmptyDescription>
            Invite team members to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>
                <span className="text-sm font-medium">{inv.email}</span>
              </TableCell>
              <TableCell>{getStatusBadge(inv.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(inv.expires_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-xs">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {inv.status === "PENDING" && (
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmAction({ type: "revoke", invitation: inv })
                        }
                      >
                        <Ban className="mr-2 size-4" />
                        Revoke
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        setConfirmAction({ type: "delete", invitation: inv })
                      }
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "revoke"
                ? "Revoke Invitation"
                : "Delete Invitation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "revoke"
                ? `Revoke the invitation sent to ${confirmAction.invitation.email}?`
                : `Delete the invitation for ${confirmAction?.invitation.email}? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <Button
              variant={
                confirmAction?.type === "delete" ? "destructive" : "default"
              }
              disabled={isMutating}
              onClick={() => {
                if (!confirmAction) return;
                const id = confirmAction.invitation.id;
                if (confirmAction.type === "revoke") onRevoke(id);
                if (confirmAction.type === "delete") onDelete(id);
                setConfirmAction(null);
              }}
            >
              {isMutating
                ? "Processing..."
                : confirmAction?.type === "revoke"
                  ? "Revoke"
                  : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
