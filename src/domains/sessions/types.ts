import type { PaginatedResponse } from "@/domains/projects/types";

export type { PaginatedResponse };

export type SessionStatus = "active" | "archived";

export interface Version {
  number: number;
  content: string;
  edited_at: string;
  tool_used: string;
}

export interface DocumentDTO {
  title: string;
  content: string;
  format: string;
  versions: Version[];
}

export interface ToolCallRecord {
  id: string;
  type: string;
  name: string;
  arguments: string;
}

export interface MessageRecord {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCallRecord[];
  tool_call_id?: string;
  created_at: string;
}

export interface SessionDTO {
  id: string;
  tenant_id: string;
  user_id: string;
  project_id: string;
  name: string;
  document: DocumentDTO;
  messages: MessageRecord[];
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  name: string;
  document: {
    title?: string;
    content?: string;
    format?: string;
  };
}

export interface UpdateSessionRequest {
  name?: string;
}

export interface SaveDocumentRequest {
  content: string;
}

export interface RunRequest {
  message: string;
}

export interface RunResponse {
  response: string;
}

export interface SSEEvent {
  type: "text" | "tool_call" | "tool_result" | "error" | "done";
  content?: string;
  tool_call_id?: string;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  message?: string;
}
