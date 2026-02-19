export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface CreateInvitationRequest {
  email: string;
  scope_template?: string;
  expires_in?: number;
}

export interface InvitationDTO {
  id: string;
  email: string;
  status: InvitationStatus;
  scopes: string[];
  expires_at: string;
  created_at: string;
}

export interface InvitationResponse {
  invitation: InvitationDTO;
  scope_templates?: string[];
}

export interface InvitationListResponse {
  invitations: InvitationResponse[];
  total: number;
}
