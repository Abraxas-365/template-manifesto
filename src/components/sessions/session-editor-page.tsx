import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Send,
  Square,
  Trash2,
  Loader2,
  Bot,
  User,
  Wrench,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSession, useClearHistory, useStreamSession } from "@/domains/sessions/hooks";
import type { SSEEvent, MessageRecord } from "@/domains/sessions/types";

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

  // Derive display messages: server data + optimistic pending messages during streaming
  const displayMessages = useMemo(() => {
    const serverMessages = session?.messages ?? [];
    if (pendingMessages.length > 0) {
      return [...serverMessages, ...pendingMessages];
    }
    return serverMessages;
  }, [session?.messages, pendingMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, streamedText]);

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput("");
    setToolEvents([]);

    // Optimistically add user message
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

    // After stream completes, session will be refetched; clear pending
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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!session) {
    return <p className="text-muted-foreground">Session not found.</p>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/projects/$projectId"
            params={{ projectId: session.project_id }}
          >
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{session.name}</h2>
          {session.document.title && (
            <p className="text-muted-foreground text-sm">
              {session.document.title}
            </p>
          )}
        </div>
        <Badge variant={session.status === "active" ? "default" : "secondary"}>
          {session.status}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearHistory}
          disabled={clearHistory.isPending}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Main content: Document + Chat side by side */}
      <ResizablePanelGroup className="flex-1 rounded-lg border">
        {/* Document panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-2">
              <h3 className="text-sm font-medium">Document</h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              {session.document.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{session.document.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Empty document. Use the chat to start editing.
                </p>
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Chat panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-2">
              <h3 className="text-sm font-medium">Chat</h3>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-4">
                {displayMessages
                  .filter((m) => m.role !== "tool")
                  .map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full">
                          <Bot className="size-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="bg-primary flex size-7 shrink-0 items-center justify-center rounded-full">
                          <User className="text-primary-foreground size-4" />
                        </div>
                      )}
                    </div>
                  ))}

                {/* Streaming response */}
                {isStreaming && streamedText && (
                  <div className="flex gap-3">
                    <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full">
                      <Bot className="size-4" />
                    </div>
                    <div className="bg-muted max-w-[80%] rounded-lg px-3 py-2 text-sm">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{streamedText}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tool events */}
                {toolEvents.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      {toolEvents.map((ev, i) => (
                        <div
                          key={i}
                          className="text-muted-foreground flex items-center gap-2 text-xs"
                        >
                          <Wrench className="size-3" />
                          <span className="font-mono">
                            {ev.tool_name}
                          </span>
                          {ev.type === "tool_result" && (
                            <Badge variant="outline" className="text-xs">
                              done
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {isStreaming && !streamedText && (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the AI to edit your document..."
                  rows={2}
                  className="min-h-[60px] resize-none"
                  disabled={isStreaming || session.status !== "active"}
                />
                {isStreaming ? (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={abort}
                    className="shrink-0 self-end"
                  >
                    <Square className="size-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || session.status !== "active"}
                    className="shrink-0 self-end"
                  >
                    <Send className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
