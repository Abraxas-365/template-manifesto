import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";
import { env } from "@/lib/env";
import type { SSEEvent } from "./types";

export function useSessionsByUser(page = 1, pageSize = 20) {
  return useQuery(
    api.sessions.listByUser.$queryOptions({
      query: { page, page_size: pageSize },
    }),
  );
}

export function useSessionsByProject(projectId: string, page = 1, pageSize = 20) {
  return useQuery({
    ...api.sessions.listByProject.$queryOptions({
      path: { projectId },
      query: { page, page_size: pageSize },
    }),
    enabled: !!projectId,
  });
}

export function useSession(id: string) {
  return useQuery({
    ...api.sessions.get.$queryOptions({ path: { id } }),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.sessions.create.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.sessions.listByUser.$key({ query: {} }),
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.sessions.update.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.sessions.listByUser.$key({ query: {} }),
      });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.sessions.delete.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.sessions.listByUser.$key({ query: {} }),
      });
    },
  });
}

export function useArchiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.sessions.archive.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.sessions.listByUser.$key({ query: {} }),
      });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.sessions.clearHistory.$mutationFn(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: api.sessions.get.$key({ path: { id: variables.path.id } }),
      });
    },
  });
}

export function useRunSession() {
  return useMutation({
    mutationFn: api.sessions.run.$mutationFn(),
  });
}

export function useStreamSession(sessionId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const stream = useCallback(
    async (message: string, onEvent?: (event: SSEEvent) => void) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setStreamedText("");

      try {
        const res = await fetch(
          `${env.BACKEND_URL}/api/v1/editor/sessions/${sessionId}/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ message }),
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          throw new Error(`Stream failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;

            try {
              const event: SSEEvent = JSON.parse(json);
              onEvent?.(event);

              if (event.type === "text" && event.content) {
                setStreamedText((prev) => prev + event.content);
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        queryClient.invalidateQueries({
          queryKey: api.sessions.get.$key({ path: { id: sessionId } }),
        });
      }
    },
    [sessionId, queryClient],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { stream, abort, isStreaming, streamedText };
}
