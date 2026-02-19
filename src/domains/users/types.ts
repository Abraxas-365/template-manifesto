export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export interface UserDetailsDTO {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  picture?: string;
  status: UserStatus;
  is_active: boolean;
  scopes: string[];
  oauth_provider: string;
}

export interface UserResponseDTO {
  user: UserDetailsDTO;
}

export interface UserListResponseDTO {
  users: UserResponseDTO[];
  total: number;
}

export interface UpdateUserRequest {
  name?: string;
  status?: UserStatus;
  scopes?: string[];
  scope_template?: string;
}

export interface SuspendUserRequest {
  reason: string;
}

export interface SetScopesRequest {
  scopes: string[];
}

export interface ApplyScopeTemplateRequest {
  template_name: string;
}

export interface ScopeDetail {
  name: string;
  description: string;
  category: string;
}

export interface UserScopesResponse {
  user_id: string;
  scopes: string[];
  scope_details: ScopeDetail[];
  total_scopes: number;
  is_admin: boolean;
}

export interface AvailableScopesResponse {
  total_scopes: number;
  categories: Record<string, ScopeDetail[]>;
  templates: string[];
}

export interface ScopeTemplateResponse {
  template_name: string;
  description?: string;
  scopes: string[];
  scope_details: ScopeDetail[];
  total_scopes: number;
}

export interface ScopeTemplatesResponse {
  templates: string[];
}
