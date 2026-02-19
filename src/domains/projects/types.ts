// ============================================================================
// Pagination
// ============================================================================

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
  empty: boolean;
}

// ============================================================================
// Project
// ============================================================================

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export interface ContentGenConfig {
  enabled: boolean;
  azure_openai_model?: string;
  temperature?: number;
  max_tokens?: number;
  allowed_outputs?: string[];
}

export interface DocumentProcConfig {
  enabled: boolean;
  allowed_formats?: string[];
  max_file_size_mb?: number;
  auto_extraction: boolean;
  semantic_search: boolean;
  ocr_enabled: boolean;
}

export interface ApprovalWorkflowConfig {
  enabled: boolean;
  require_reviewer_step: boolean;
  require_admin_approval: boolean;
  auto_approve_threshold?: number | null;
  notify_on_submission: boolean;
  notify_on_approval: boolean;
}

export interface ProjectMetadata {
  translation_enabled: boolean;
  source_language?: string;
  target_languages?: string[];
  translation_mode?: string;
  content_generation: ContentGenConfig;
  document_processing: DocumentProcConfig;
  approval_workflow: ApprovalWorkflowConfig;
  chat_enabled: boolean;
  custom_fields?: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  place: string;
  country: string;
  theme: string;
  metadata: ProjectMetadata;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  members?: ProjectMember[];
}

// ============================================================================
// Project Member
// ============================================================================

export interface MemberUser {
  id: string;
  email: string;
  name?: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  added_by: string;
  added_at: string;
  removed_at?: string | null;
  user?: MemberUser;
  project?: Project;
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  place: string;
  country: string;
  theme?: string;
  metadata?: ProjectMetadata;
  status?: ProjectStatus;
}

export interface UpdateProjectRequest {
  name?: string;
  place?: string;
  country?: string;
  theme?: string;
  metadata?: ProjectMetadata;
  status?: ProjectStatus;
}

export interface UpdateProjectStatusRequest {
  status: ProjectStatus;
}

export interface AddProjectMemberRequest {
  user_id: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface ProjectStats {
  total_members: number;
  total_outcomes?: number;
  total_documents?: number;
  pending_approvals?: number;
  completed_outcomes?: number;
}

export interface ProjectDetailResponse {
  project: Project;
  members: ProjectMember[];
  stats: ProjectStats;
}

// ============================================================================
// Query Parameters
// ============================================================================

export type ProjectListQuery = {
  page?: number;
  page_size?: number;
  status?: ProjectStatus;
  search?: string;
  country?: string;
  theme?: string;
};

export type MemberListQuery = {
  page?: number;
  page_size?: number;
};
