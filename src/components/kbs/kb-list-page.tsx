import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  BookOpen,
  MoreHorizontal,
  Trash2,
  Plus,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useKnowledgeBases,
  useCreateKB,
  useDeleteKB,
  useAddTextSource,
  useRemoveKBSource,
} from "@/domains/kbs/hooks";
import type { CreateKBRequest, AddTextSourceRequest, KBDTO } from "@/domains/kbs/types";

function CreateKBDialog() {
  const [open, setOpen] = useState(false);
  const createKB = useCreateKB();

  const form = useForm<CreateKBRequest>({
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createKB.mutateAsync({ body: data });
      toast.success("Knowledge base created");
      setOpen(false);
      form.reset();
    } catch {
      // global error handler
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          New KB
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Knowledge Base</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="kb-name">Name</Label>
            <Input
              id="kb-name"
              placeholder="My knowledge base"
              {...form.register("name", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="kb-desc">Description</Label>
            <Textarea
              id="kb-desc"
              placeholder="What does this KB contain?"
              {...form.register("description")}
            />
          </div>
          <Button type="submit" disabled={createKB.isPending}>
            {createKB.isPending ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTextSourceDialog({ kbId }: { kbId: string }) {
  const [open, setOpen] = useState(false);
  const addSource = useAddTextSource();

  const form = useForm<AddTextSourceRequest>({
    defaultValues: { name: "", content: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await addSource.mutateAsync({ path: { id: kbId }, body: data });
      toast.success("Source added");
      setOpen(false);
      form.reset();
    } catch {
      // global error handler
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 size-3" />
          Add Text
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Text Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="source-name">Name</Label>
            <Input
              id="source-name"
              placeholder="Source name"
              {...form.register("name", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source-content">Content</Label>
            <Textarea
              id="source-content"
              placeholder="Paste your reference content here..."
              rows={8}
              {...form.register("content", { required: true })}
            />
          </div>
          <Button type="submit" disabled={addSource.isPending}>
            {addSource.isPending ? "Adding..." : "Add Source"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KBCard({ kb }: { kb: KBDTO }) {
  const deleteKB = useDeleteKB();
  const removeSource = useRemoveKBSource();

  const handleDelete = async () => {
    try {
      await deleteKB.mutateAsync({ path: { id: kb.id } });
      toast.success("Knowledge base deleted");
    } catch {
      // global error handler
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    try {
      await removeSource.mutateAsync({
        path: { id: kb.id, sourceId },
      });
      toast.success("Source removed");
    } catch {
      // global error handler
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              {kb.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {kb.description || "No description"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-muted-foreground text-sm">
            {kb.sources.length} source{kb.sources.length !== 1 ? "s" : ""}
          </span>
          <AddTextSourceDialog kbId={kb.id} />
        </div>
        {kb.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {kb.sources.map((source) => (
              <Badge
                key={source.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <FileText className="size-3" />
                {source.name}
                <button
                  onClick={() => handleRemoveSource(source.id)}
                  className="hover:text-destructive ml-1"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KBListPage() {
  const { data, isLoading } = useKnowledgeBases();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Knowledge Bases
          </h2>
          <p className="text-muted-foreground">
            Manage reference material for your AI editor
          </p>
        </div>
        <CreateKBDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <BookOpen className="text-muted-foreground mb-4 size-12" />
          <h3 className="text-lg font-semibold">No knowledge bases yet</h3>
          <p className="text-muted-foreground mb-4">
            Create a KB to provide reference material to the AI editor
          </p>
          <CreateKBDialog />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((kb) => (
            <KBCard key={kb.id} kb={kb} />
          ))}
        </div>
      )}
    </div>
  );
}
