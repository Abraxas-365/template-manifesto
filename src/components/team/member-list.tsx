import { useState } from "react";
import {
  MoreHorizontal,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { UserDetailsDTO } from "@/domains/users/types";

type ConfirmAction =
  | { type: "suspend"; user: UserDetailsDTO }
  | { type: "activate"; user: UserDetailsDTO }
  | { type: "delete"; user: UserDetailsDTO };

interface TeamMemberListProps {
  users: UserDetailsDTO[];
  isLoading: boolean;
  currentUserId: string;
  onSuspend: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDelete: (userId: string) => void;
  onChangeRole: (user: UserDetailsDTO) => void;
  isMutating: boolean;
}

function getInitials(user: UserDetailsDTO): string {
  if (user.name) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email[0]!.toUpperCase();
}

function getStatusBadge(user: UserDetailsDTO) {
  switch (user.status) {
    case "ACTIVE":
      return <Badge variant="success">Active</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    case "PENDING":
      return <Badge variant="warning">Pending</Badge>;
    case "INACTIVE":
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="outline">{user.status}</Badge>;
  }
}

function getRoleLabel(user: UserDetailsDTO): string {
  if (user.scopes.includes("*")) return "Super Admin";
  if (user.scopes.includes("admin:*")) return "Platform Admin";
  if (user.scopes.includes("users:*") && user.scopes.includes("projects:*"))
    return "Tenant Admin";
  if (user.scopes.includes("projects:*")) return "Project Admin";
  if (
    user.scopes.includes("projects:read") &&
    user.scopes.includes("projects:write")
  )
    return "Project Manager";
  if (user.scopes.includes("outcomes:*")) return "Outcome Editor";
  if (user.scopes.length <= 3) return "Viewer";
  return "Custom";
}

export function TeamMemberList({
  users,
  isLoading,
  currentUserId,
  onSuspend,
  onActivate,
  onDelete,
  onChangeRole,
  isMutating,
}: TeamMemberListProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>No team members</EmptyTitle>
          <EmptyDescription>
            Invite members to start collaborating.
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
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.name || user.email}
                        {isSelf && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      {user.name && (
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(user)}</TableCell>
                <TableCell>
                  <span className="text-sm">{getRoleLabel(user)}</span>
                </TableCell>
                <TableCell>
                  {!isSelf && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onChangeRole(user)}>
                          <ShieldCheck className="mr-2 size-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({ type: "suspend", user })
                            }
                          >
                            <UserX className="mr-2 size-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {user.status === "PENDING" && (
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({ type: "activate", user })
                            }
                          >
                            <UserCheck className="mr-2 size-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            setConfirmAction({ type: "delete", user })
                          }
                        >
                          <Trash2 className="mr-2 size-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "suspend" && "Suspend Member"}
              {confirmAction?.type === "activate" && "Activate Member"}
              {confirmAction?.type === "delete" && "Remove Member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "suspend" &&
                `Are you sure you want to suspend ${confirmAction.user.name || confirmAction.user.email}? They will not be able to access the platform.`}
              {confirmAction?.type === "activate" &&
                `Activate ${confirmAction.user.name || confirmAction.user.email}? They will regain access to the platform.`}
              {confirmAction?.type === "delete" &&
                `Are you sure you want to remove ${confirmAction.user.name || confirmAction.user.email}? This action cannot be undone.`}
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
                const userId = confirmAction.user.id;
                if (confirmAction.type === "suspend") onSuspend(userId);
                if (confirmAction.type === "activate") onActivate(userId);
                if (confirmAction.type === "delete") onDelete(userId);
                setConfirmAction(null);
              }}
            >
              {isMutating
                ? "Processing..."
                : confirmAction?.type === "suspend"
                  ? "Suspend"
                  : confirmAction?.type === "activate"
                    ? "Activate"
                    : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
