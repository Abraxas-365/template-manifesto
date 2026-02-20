import type { PaginatedResponse } from "@/domains/projects/types";

export type { PaginatedResponse };

export type SourceType = "text" | "file" | "url";

export interface KBSource {
  id: string;
  type: SourceType;
  name: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  ingested_at: string;
}

export interface KBDTO {
  id: string;
  tenant_id: string;
  owner_id: string;
  name: string;
  description: string;
  namespace: string;
  chunk_size: number;
  chunk_overlap: number;
  retrieval_top_k: number;
  retrieval_min_score: number;
  sources: KBSource[];
  created_at: string;
  updated_at: string;
}

export interface CreateKBRequest {
  name: string;
  description?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  retrieval_top_k?: number;
  retrieval_min_score?: number;
}

export interface AddTextSourceRequest {
  name: string;
  content: string;
  metadata?: Record<string, unknown>;
}
