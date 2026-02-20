import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
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
  useStreamSession,
} from "@/domains/sessions/hooks";
import type { SSEEvent, MessageRecord } from "@/domains/sessions/types";

const lowlight = createLowlight(common);

function DocumentEditor({ content }: { content: string }) {
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
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
        breaks: false,
      }),
    ],
    // Initialize empty — content is set via setContent() so tiptap-markdown parses it
    content: "",
    editable: true,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-8 py-6 " +
          // Heading styles
          "prose-headings:font-display prose-headings:tracking-tight " +
          "prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4 " +
          "prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3 " +
          "prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 " +
          // Body
          "prose-p:leading-7 prose-p:text-[15px] " +
          // Lists
          "prose-li:text-[15px] prose-li:leading-7 " +
          "prose-ul:my-4 prose-ol:my-4 " +
          // Code
          "prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none " +
          "prose-pre:rounded-lg prose-pre:bg-[#1e1e2e] prose-pre:border prose-pre:border-border/50 prose-pre:shadow-sm " +
          // Links
          "prose-a:text-primary prose-a:underline-offset-4 prose-a:decoration-primary/30 hover:prose-a:decoration-primary " +
          // Blockquotes
          "prose-blockquote:border-l-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic " +
          // Strong
          "prose-strong:font-semibold",
      },
    },
  });

  // Set content via setContent() so tiptap-markdown parses markdown→HTML properly.
  // The initial `content` prop in useEditor is treated as HTML, not markdown.
  useEffect(() => {
    if (editor && content !== undefined) {
      const storage = editor.storage as Record<string, any>;
      const currentMd = storage.markdown?.getMarkdown?.() ?? "";
      if (currentMd.trim() !== content.trim()) {
        editor.commands.setContent(content || "");
      }
    }
  }, [editor, content]);

  return <EditorContent editor={editor} />;
}

function ChatMessage({ msg }: { msg: MessageRecord }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
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
              "prose-code:rounded prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none " +
              "prose-pre:rounded-lg prose-pre:bg-[#1e1e2e] prose-pre:text-[13px] prose-pre:my-2 " +
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
    <div className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs">
      {isDone ? (
        <CheckCircle2 className="text-pa-success size-3" />
      ) : (
        <Circle className="text-muted-foreground size-3 animate-pulse" />
      )}
      <Wrench className="text-muted-foreground size-3" />
      <span className="font-mono text-[11px]">{event.tool_name}</span>
    </div>
  );
}

export function SessionEditorPage() {
  const { sessionId } = useParams({
    from: "/_authenticated/sessions/$sessionId",
  });
  const { data: session, isLoading } = useSession(sessionId);
  const clearHistory = useClearHistory();
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

  const handleClearHistory = async () => {
    try {
      await clearHistory.mutateAsync({ path: { id: sessionId } });
      setPendingMessages([]);
      toast.success("History cleared");
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
          variant={session.status === "active" ? "default" : "secondary"}
          className="shrink-0"
        >
          {session.status}
        </Badge>

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
      <ResizablePanelGroup className="flex-1 overflow-hidden rounded-xl border shadow-sm">
        {/* Document panel */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <FileText className="text-muted-foreground size-4" />
              <h3 className="text-sm font-medium">Document</h3>
              {session.document.versions &&
                session.document.versions.length > 0 && (
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    v{session.document.versions.length}
                  </Badge>
                )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DocumentEditor content={session.document.content} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Chat panel */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="flex h-full flex-col bg-background">
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <Bot className="text-muted-foreground size-4" />
              <h3 className="text-sm font-medium">Chat</h3>
              {isStreaming && (
                <Badge
                  variant="outline"
                  className="ml-auto animate-pulse text-[10px]"
                >
                  streaming
                </Badge>
              )}
            </div>

            {/* Messages area */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                {displayMessages.length === 0 && !isStreaming && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bot className="text-muted-foreground/50 mb-3 size-10" />
                    <p className="text-muted-foreground text-sm">
                      Send a message to start editing your document.
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
                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Bot className="size-4" />
                    </div>
                    <div className="bg-muted max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed">
                      <div
                        className={
                          "prose prose-sm dark:prose-invert max-w-none " +
                          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
                          "prose-p:leading-6 prose-p:my-1.5 " +
                          "prose-code:rounded prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none " +
                          "prose-pre:rounded-lg prose-pre:bg-[#1e1e2e] prose-pre:text-[13px] prose-pre:my-2"
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
                  <div className="flex flex-wrap gap-1.5 pl-11">
                    {toolEvents.map((ev, i) => (
                      <ToolEventBadge key={i} event={ev} />
                    ))}
                  </div>
                )}

                {/* Thinking indicator */}
                {isStreaming && !streamedText && (
                  <div className="flex items-center gap-3">
                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Bot className="size-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
                        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
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
            <div className="border-t p-3">
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
                  className="max-h-32 min-h-[44px] resize-none rounded-xl"
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
                        className="size-10 shrink-0 rounded-xl"
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
