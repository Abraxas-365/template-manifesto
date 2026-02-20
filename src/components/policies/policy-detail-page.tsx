import { useState } from "react";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Save,
  SendHorizonal,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Calendar,
  User,
  Tag,
  FileText,
  Clock,
  GitBranch,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  usePolicy,
  useUpdatePolicy,
  useSubmitForReview,
  useApprovePolicy,
  useRetirePolicy,
  useDeletePolicy,
} from "@/domains/policies/hooks";
import { useCreateSession } from "@/domains/sessions/hooks";
import { PolicyStatusBadge } from "./policy-status-badge";
import type {
  Classification,
  PolicyMetadata,
} from "@/domains/policies/types";

export function PolicyDetailPage() {
  const { policyId } = useParams({
    from: "/_authenticated/policies/$policyId",
  });
  const navigate = useNavigate();
  const { data: policy, isLoading } = usePolicy(policyId);
  const { data: previousPolicy } = usePolicy(policy?.previous_policy_id ?? "");
  const updatePolicy = useUpdatePolicy();
  const submitForReview = useSubmitForReview();
  const approvePolicy = useApprovePolicy();
  const retirePolicy = useRetirePolicy();
  const deletePolicy = useDeletePolicy();

  const createSession = useCreateSession();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMetadata, setEditMetadata] = useState<PolicyMetadata | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approver, setApprover] = useState("");

  const isDraft = policy?.metadata.status === "draft";
  const isReview = policy?.metadata.status === "review";
  const isApproved = policy?.metadata.status === "approved";

  const startEditing = () => {
    if (!policy) return;
    setEditTitle(policy.title);
    setEditContent(policy.content);
    setEditMetadata({ ...policy.metadata });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditMetadata(null);
  };

  const handleSave = async () => {
    if (!policy || !editMetadata) return;
    try {
      await updatePolicy.mutateAsync({
        path: { id: policy.id },
        body: {
          title: editTitle,
          content: editContent,
          metadata: editMetadata,
        },
      });
      toast.success("Policy updated");
      setIsEditing(false);
    } catch {
      // global error handler
    }
  };

  const handleSubmitForReview = async () => {
    if (!policy) return;
    try {
      await submitForReview.mutateAsync({ path: { id: policy.id } });
      toast.success("Policy submitted for review");
    } catch {
      // global error handler
    }
  };

  const handleApprove = async () => {
    if (!policy || !approver) return;
    try {
      await approvePolicy.mutateAsync({
        path: { id: policy.id },
        body: { approver },
      });
      toast.success("Policy approved");
      setApproveDialogOpen(false);
      setApprover("");
    } catch {
      // global error handler
    }
  };

  const handleRetire = async () => {
    if (!policy) return;
    try {
      await retirePolicy.mutateAsync({ path: { id: policy.id } });
      toast.success("Policy retired");
    } catch {
      // global error handler
    }
  };

  const handleCreateNewVersion = async () => {
    if (!policy) return;
    try {
      const session = await createSession.mutateAsync({
        path: { projectId: policy.project_id },
        body: {
          name: `${policy.title} - New Version`,
          document: {
            title: policy.title,
            content: policy.content,
          },
        },
      });
      toast.success("Session created from policy");
      void navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: session.id },
        search: { fromPolicyId: policy.id },
      });
    } catch {
      // global error handler
    }
  };

  const handleDelete = async () => {
    if (!policy) return;
    try {
      await deletePolicy.mutateAsync({ path: { id: policy.id } });
      toast.success("Policy deleted");
      void navigate({
        to: "/policies",
        search: { projectId: policy.project_id },
      });
    } catch {
      // global error handler
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShieldAlert className="text-muted-foreground mb-3 size-12" />
        <p className="text-muted-foreground text-lg">Policy not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/policies">Back to Policies</Link>
        </Button>
      </div>
    );
  }

  const metadata = isEditing ? editMetadata! : policy.metadata;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link
                to="/policies"
                search={{ projectId: policy.project_id }}
              >
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to policies</TooltipContent>
        </Tooltip>

        <div className="min-w-0 flex-1">
          <h2 className="font-display truncate text-2xl font-bold tracking-tight">
            {isEditing ? editTitle : policy.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {metadata.document_id} &middot; v{metadata.version}
          </p>
        </div>

        <PolicyStatusBadge status={policy.metadata.status} />

        {/* Action buttons based on status */}
        <div className="flex items-center gap-2">
          {isDraft && !isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                Edit
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitForReview}
                disabled={submitForReview.isPending}
              >
                <SendHorizonal className="size-4" />
                Submit for Review
              </Button>
            </>
          )}
          {isDraft && isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updatePolicy.isPending}
              >
                <Save className="size-4" />
                Save
              </Button>
            </>
          )}
          {isReview && (
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Policy</DialogTitle>
                  <DialogDescription>
                    This will mark the policy as officially approved.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                  <Label htmlFor="approver">Approver Name / Role</Label>
                  <Input
                    id="approver"
                    value={approver}
                    onChange={(e) => setApprover(e.target.value)}
                    placeholder="e.g. Director General"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setApproveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={!approver || approvePolicy.isPending}
                  >
                    Approve
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {isApproved && (
            <>
              <Button
                size="sm"
                onClick={handleCreateNewVersion}
                disabled={createSession.isPending}
              >
                {createSession.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GitBranch className="size-4" />
                )}
                {createSession.isPending ? "Creating..." : "Create New Version"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetire}
                disabled={retirePolicy.isPending}
              >
                <XCircle className="size-4" />
                Retire
              </Button>
            </>
          )}
          {isDraft && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={handleDelete}
              disabled={deletePolicy.isPending}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Document content */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Policy Document
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content (Markdown)</Label>
                  <Textarea
                    id="content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="mt-1.5 min-h-[400px] font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div
                className={
                  "prose prose-sm max-w-none " +
                  "prose-headings:font-semibold " +
                  "prose-p:leading-7 " +
                  "prose-ul:my-2 prose-ol:my-2 " +
                  "prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs " +
                  "prose-pre:rounded-xl prose-pre:bg-[#1e1e2e] prose-pre:text-[13px]"
                }
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {policy.content}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <MetadataRow
                icon={<FileText className="size-3.5" />}
                label="Document ID"
              >
                {isEditing ? (
                  <Input
                    value={editMetadata!.document_id}
                    onChange={(e) =>
                      setEditMetadata({
                        ...editMetadata!,
                        document_id: e.target.value,
                      })
                    }
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-sm">{metadata.document_id}</span>
                )}
              </MetadataRow>

              <MetadataRow
                icon={<Tag className="size-3.5" />}
                label="Version"
              >
                <span className="text-sm">{metadata.version}</span>
              </MetadataRow>

              <MetadataRow
                icon={<ShieldAlert className="size-3.5" />}
                label="Classification"
              >
                {isEditing ? (
                  <Select
                    value={editMetadata!.classification}
                    onValueChange={(v) =>
                      setEditMetadata({
                        ...editMetadata!,
                        classification: v as Classification,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-xs capitalize">
                    {metadata.classification}
                  </Badge>
                )}
              </MetadataRow>

              <MetadataRow
                icon={<User className="size-3.5" />}
                label="Owner"
              >
                {isEditing ? (
                  <Input
                    value={editMetadata!.owner}
                    onChange={(e) =>
                      setEditMetadata({
                        ...editMetadata!,
                        owner: e.target.value,
                      })
                    }
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-sm">{metadata.owner}</span>
                )}
              </MetadataRow>

              {metadata.approver && (
                <MetadataRow
                  icon={<CheckCircle2 className="size-3.5" />}
                  label="Approver"
                >
                  <span className="text-sm">{metadata.approver}</span>
                </MetadataRow>
              )}

              {previousPolicy && (
                <MetadataRow
                  icon={<GitBranch className="size-3.5" />}
                  label="Previous Version"
                >
                  <Link
                    to="/policies/$policyId"
                    params={{ policyId: previousPolicy.id }}
                    className="text-sm text-primary hover:underline"
                  >
                    {previousPolicy.title} (v{previousPolicy.metadata.version})
                  </Link>
                </MetadataRow>
              )}

              <Separator />

              <MetadataRow
                icon={<Calendar className="size-3.5" />}
                label="Effective Date"
              >
                <span className="text-sm">
                  {metadata.effective_date
                    ? new Date(metadata.effective_date).toLocaleDateString()
                    : "—"}
                </span>
              </MetadataRow>

              <MetadataRow
                icon={<Clock className="size-3.5" />}
                label="Review Date"
              >
                <span className="text-sm">
                  {metadata.review_date
                    ? new Date(metadata.review_date).toLocaleDateString()
                    : "—"}
                </span>
              </MetadataRow>
            </CardContent>
          </Card>

          {/* ISO Controls */}
          {metadata.iso_controls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ISO 27001 Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {metadata.iso_controls.map((ctrl) => (
                    <div
                      key={ctrl.code}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[10px] font-mono"
                      >
                        {ctrl.code}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {ctrl.description}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {metadata.tags && metadata.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {metadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revision History */}
          {metadata.revision_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revision History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {metadata.revision_history.map((rev, i) => (
                    <div key={i} className="flex flex-col gap-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          v{rev.version}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(rev.changed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-muted-foreground pl-1">
                        {rev.changed_by}: {rev.description}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
