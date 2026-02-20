import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { useParams, useSearch, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Send,
  Square,
  Trash2,
  Bot,
  User,
  Wrench,
  FileText,
  CheckCircle2,
  Circle,
  ShieldAlert,
  Save,
  GitBranch,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import ImageExtension from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import { marked } from "marked";
import TurndownService from "turndown";
import { EditorToolbar } from "./editor-toolbar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  useSession,
  useClearHistory,
  useSaveDocument,
  useStreamSession,
} from "@/domains/sessions/hooks";
import { useGeneratePolicy, usePolicy } from "@/domains/policies/hooks";
import type { SSEEvent, MessageRecord } from "@/domains/sessions/types";

const lowlight = createLowlight(common);
const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

// Convert markdown to HTML using `marked` — tiptap-markdown's setContent()
// override is broken with Tiptap v3, so we do the conversion ourselves.
function markdownToHtml(md: string): string {
  if (!md) return "";
  return marked.parse(md, { async: false, gfm: true, breaks: false }) as string;
}

export interface DocumentEditorHandle {
  getMarkdown: () => string;
}

const DocumentEditor = forwardRef<DocumentEditorHandle, { content: string }>(
  function DocumentEditor({ content }, ref) {
    const htmlContent = useMemo(() => markdownToHtml(content), [content]);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: false, // replaced by CodeBlockLowlight
        }),
        CodeBlockLowlight.configure({
          lowlight,
        }),
        Placeholder.configure({
          placeholder: "Start writing or let the AI generate content…",
        }),
        Underline,
        LinkExtension.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-4 cursor-pointer",
          },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Highlight.configure({
          multicolor: false,
        }),
        TextStyle,
        Color,
        ImageExtension.configure({
          inline: false,
          allowBase64: true,
        }),
      ],
      content: htmlContent,
      editable: true,
      editorProps: {
        attributes: {
          class: "tiptap-editor focus:outline-none min-h-[300px] px-8 py-6",
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        if (!editor) return "";
        return turndown.turndown(editor.getHTML());
      },
    }), [editor]);

    // Sync when backend content updates (e.g. after AI edits the document)
    useEffect(() => {
      if (editor && content !== undefined) {
        const newHtml = markdownToHtml(content);
        const currentHtml = editor.getHTML();
        if (currentHtml !== newHtml) {
          editor.commands.setContent(newHtml);
        }
      }
    }, [editor, content]);

    return (
      <div className="flex h-full flex-col bg-white">
        <EditorToolbar editor={editor} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);

function ChatMessage({ msg }: { msg: MessageRecord }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-primary/10 text-primary"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md shadow-sm"
            : "rounded-tl-md border border-border/40 bg-white shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div
            className={
              "prose prose-sm dark:prose-invert max-w-none " +
              "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
              "prose-p:leading-6 prose-p:my-1.5 " +
              "prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 " +
              "prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 " +
              "prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none " +
              "prose-pre:rounded-xl prose-pre:bg-[#1e1e2e] prose-pre:text-[13px] prose-pre:my-2 " +
              "prose-a:text-primary prose-a:underline-offset-2 " +
              "prose-blockquote:border-l-primary/40 prose-blockquote:not-italic prose-blockquote:pl-3 prose-blockquote:my-2 " +
              "prose-strong:font-semibold " +
              "prose-hr:my-3"
            }
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolEventBadge({ event }: { event: SSEEvent }) {
  const isDone = event.type === "tool_result";

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-white px-2.5 py-1 text-xs shadow-sm">
      {isDone ? (
        <CheckCircle2 className="size-3 text-emerald-500" />
      ) : (
        <Circle className="text-muted-foreground size-3 animate-pulse" />
      )}
      <Wrench className="text-muted-foreground size-3" />
      <span className="font-mono text-[11px] text-muted-foreground">{event.tool_name}</span>
    </div>
  );
}

export function SessionEditorPage() {
  const { sessionId } = useParams({
    from: "/_authenticated/sessions/$sessionId",
  });
  const { fromPolicyId } = useSearch({
    from: "/_authenticated/sessions/$sessionId",
  });
  const navigate = useNavigate();
  const { data: session, isLoading } = useSession(sessionId);
  const { data: basePolicy } = usePolicy(fromPolicyId ?? "");
  const clearHistory = useClearHistory();
  const saveDocument = useSaveDocument();
  const generatePolicy = useGeneratePolicy();
  const editorRef = useRef<DocumentEditorHandle>(null);
  const { stream, abort, isStreaming, streamedText } =
    useStreamSession(sessionId);

  const [input, setInput] = useState("");
  const [pendingMessages, setPendingMessages] = useState<MessageRecord[]>([]);
  const [toolEvents, setToolEvents] = useState<SSEEvent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter: no tool messages, no empty assistant messages
  const displayMessages = useMemo(() => {
    const serverMessages = session?.messages ?? [];
    const all =
      pendingMessages.length > 0
        ? [...serverMessages, ...pendingMessages]
        : serverMessages;
    return all.filter(
      (m) => m.role !== "tool" && !(m.role === "assistant" && !m.content),
    );
  }, [session?.messages, pendingMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, streamedText]);

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput("");
    setToolEvents([]);

    const userMsg: MessageRecord = {
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setPendingMessages([userMsg]);

    await stream(message, (event: SSEEvent) => {
      if (event.type === "tool_call" || event.type === "tool_result") {
        setToolEvents((prev) => [...prev, event]);
      }
      if (event.type === "error" && event.message) {
        toast.error(event.message);
      }
    });

    setPendingMessages([]);
  }, [input, isStreaming, stream]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGeneratePolicy = async () => {
    try {
      const result = await generatePolicy.mutateAsync({
        path: { sessionId },
        body: fromPolicyId ? { previous_policy_id: fromPolicyId } : {},
      });
      toast.success(
        fromPolicyId
          ? "New policy version generated. The previous version will be auto-retired on approval."
          : "Policy generated",
      );
      void navigate({
        to: "/policies/$policyId",
        params: { policyId: result.id },
      });
    } catch {
      // global error handler
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory.mutateAsync({ path: { id: sessionId } });
      setPendingMessages([]);
      toast.success("History cleared");
    } catch {
      // global error handler
    }
  };

  const handleSaveDocument = async () => {
    const content = editorRef.current?.getMarkdown();
    if (!content) return;
    try {
      await saveDocument.mutateAsync({
        path: { id: sessionId },
        body: { content },
      });
      toast.success("Document saved");
    } catch {
      // global error handler
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <FileText className="text-muted-foreground mx-auto mb-3 size-12" />
          <p className="text-muted-foreground text-lg">Session not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link
                to="/projects/$projectId"
                params={{ projectId: session.project_id }}
              >
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to project</TooltipContent>
        </Tooltip>

        <div className="min-w-0 flex-1">
          <h2 className="font-display truncate text-lg font-semibold leading-tight">
            {session.name}
          </h2>
          {session.document.title && (
            <p className="text-muted-foreground truncate text-xs">
              {session.document.title}
            </p>
          )}
        </div>

        <Badge
          variant={session.status === "active" ? "success" : "secondary"}
          className="shrink-0"
        >
          {session.status}
        </Badge>

        {fromPolicyId && basePolicy && (
          <Badge variant="outline" className="shrink-0 gap-1">
            <GitBranch className="size-3" />
            Revising: {basePolicy.title} (v{basePolicy.metadata.version})
          </Badge>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePolicy}
              disabled={generatePolicy.isPending || session.status !== "active"}
            >
              <ShieldAlert className="size-4" />
              {generatePolicy.isPending ? "Generating..." : "Generate Policy"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Generate ISO 27001 policy from this session</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleClearHistory}
              disabled={clearHistory.isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear history</TooltipContent>
        </Tooltip>
      </div>

      {/* Main layout */}
      <ResizablePanelGroup className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
        {/* Document panel */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border/60 bg-white px-4 py-2.5">
              <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                <FileText className="size-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-medium">Document</h3>
              {session.document.versions &&
                session.document.versions.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    v{session.document.versions.length}
                  </Badge>
                )}
              <div className="ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={handleSaveDocument}
                      disabled={saveDocument.isPending || session.status !== "active"}
                    >
                      <Save className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save document</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <DocumentEditor ref={editorRef} content={session.document.content} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Chat panel */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="flex h-full flex-col"
            style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" }}
          >
            <div className="flex items-center gap-2 border-b border-border/60 bg-white px-4 py-2.5">
              <div className="flex size-6 items-center justify-center rounded-md bg-indigo-500/10">
                <Bot className="size-3.5 text-indigo-500" />
              </div>
              <h3 className="text-sm font-medium">AI Assistant</h3>
              {isStreaming && (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-medium text-emerald-600">
                    Streaming
                  </span>
                </div>
              )}
            </div>

            {/* Messages area */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                {displayMessages.length === 0 && !isStreaming && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-border/40">
                      <Bot className="text-muted-foreground/60 size-7" />
                    </div>
                    <p className="text-muted-foreground mt-4 text-sm font-medium">
                      Start a conversation
                    </p>
                    <p className="text-muted-foreground/60 mt-1 max-w-48 text-xs">
                      Ask the AI to help draft, edit, or review your document.
                    </p>
                  </div>
                )}

                {displayMessages.map((msg, i) => (
                  <ChatMessage
                    key={`${msg.role}-${msg.created_at}-${i}`}
                    msg={msg}
                  />
                ))}

                {/* Streaming assistant response */}
                {isStreaming && streamedText && (
                  <div className="flex gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Bot className="size-3.5" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-border/40 bg-white px-4 py-2.5 text-sm leading-relaxed shadow-sm">
                      <div
                        className={
                          "prose prose-sm dark:prose-invert max-w-none " +
                          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
                          "prose-p:leading-6 prose-p:my-1.5 " +
                          "prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none " +
                          "prose-pre:rounded-xl prose-pre:bg-[#1e1e2e] prose-pre:text-[13px] prose-pre:my-2"
                        }
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamedText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tool events as compact pills */}
                {toolEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-10">
                    {toolEvents.map((ev, i) => (
                      <ToolEventBadge key={i} event={ev} />
                    ))}
                  </div>
                )}

                {/* Thinking indicator */}
                {isStreaming && !streamedText && (
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Bot className="size-3.5" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-white px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:0ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:150ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:300ms]" />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-border/60 bg-white p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    session.status !== "active"
                      ? "Session is archived"
                      : "Ask the AI to edit your document..."
                  }
                  rows={1}
                  className="max-h-32 min-h-[44px] resize-none rounded-xl border-border/60 bg-slate-50 shadow-none focus-visible:bg-white"
                  disabled={isStreaming || session.status !== "active"}
                />
                {isStreaming ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={abort}
                        className="size-10 shrink-0 rounded-xl"
                      >
                        <Square className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generating</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={
                          !input.trim() || session.status !== "active"
                        }
                        className="size-10 shrink-0 rounded-xl shadow-sm"
                      >
                        <Send className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
