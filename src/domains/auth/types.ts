export interface UserDTO {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  picture: string;
  status: string;
  scopes: string[];
  oauth_provider: string;
  otp_enabled: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantDTO {
  id: string;
  company_name: string;
  status: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserDTO;
  tenant: TenantDTO;
}

export interface MeResponse {
  user: UserDTO;
  tenant: TenantDTO;
}

export interface LoginInitRequest {
  provider: "GOOGLE" | "MICROSOFT";
  invitation_token?: string;
}

export interface LoginInitResponse {
  auth_url: string;
  state: string;
}

export interface TenantDiscoveryRequest {
  email: string;
}

export interface TenantInfo {
  tenant_id: string;
  company_name: string;
  user_status: string;
  auth_methods: {
    otp: boolean;
    oauth: boolean;
    oauth_provider: string;
  };
}

export interface TenantDiscoveryResponse {
  email: string;
  tenants: TenantInfo[];
  count: number;
}

export interface OtpLoginInitRequest {
  email: string;
  tenant_id: string;
}

export interface OtpLoginInitResponse {
  message: string;
  email: string;
  expires_in_seconds: number;
  auth_methods: {
    otp: boolean;
    oauth: boolean;
    oauth_provider: string;
  };
}

export interface OtpLoginVerifyRequest {
  email: string;
  code: string;
  tenant_id: string;
}

export interface OtpResendRequest {
  email: string;
  tenant_id: string;
  purpose: "signup" | "login";
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthError {
  error: string;
  code: string;
  type: string;
  status: number;
  details?: unknown;
  request_id?: string;
}
