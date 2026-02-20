import type { PaginatedResponse } from "@/domains/projects/types";

export type { PaginatedResponse };

export type PolicyStatus = "draft" | "review" | "approved" | "retired";

export type Classification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export interface ISOControl {
  code: string;
  description: string;
}

export interface RevisionEntry {
  version: string;
  changed_at: string;
  changed_by: string;
  description: string;
}

export interface PolicyMetadata {
  document_id: string;
  version: string;
  classification: Classification;
  owner: string;
  approver: string;
  effective_date?: string;
  review_date?: string;
  status: PolicyStatus;
  iso_controls: ISOControl[];
  tags?: string[];
  revision_history: RevisionEntry[];
}

export interface PolicyDTO {
  id: string;
  tenant_id: string;
  project_id: string;
  session_id: string;
  owner_id: string;
  title: string;
  content: string;
  metadata: PolicyMetadata;
  previous_policy_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateFromSessionRequest {
  previous_policy_id?: string;
}

export interface UpdatePolicyRequest {
  title?: string;
  content?: string;
  metadata?: PolicyMetadata;
}

export interface PublishPolicyRequest {
  approver: string;
  effective_date?: string;
  review_date?: string;
}
