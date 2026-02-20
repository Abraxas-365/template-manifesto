export interface LLMConfig {
  model: string;
  temperature: number;
  max_tokens?: number;
  reasoning_effort?: string;
}

export interface EditorConfig {
  default_format: string;
  preserve_formatting: boolean;
  auto_save_versions: boolean;
  max_document_size_kb: number;
}

export interface ProjectDTO {
  id: string;
  tenant_id: string;
  owner_id: string;
  name: string;
  description: string;
  system_prompt: string;
  llm_config: LLMConfig;
  editor_config: EditorConfig;
  kb_id?: string;
  enabled_tools: string[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  system_prompt?: string;
  llm_config?: LLMConfig;
  editor_config?: EditorConfig;
  enabled_tools?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  system_prompt?: string;
  llm_config?: LLMConfig;
  editor_config?: EditorConfig;
  enabled_tools?: string[];
}

export interface AttachKBRequest {
  kb_id: string;
}
