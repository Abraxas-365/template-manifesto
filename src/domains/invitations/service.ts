import { endpoint, t } from "@/lib/api-client";
import type {
  CreateInvitationRequest,
  InvitationListResponse,
  InvitationResponse,
} from "./types";

export const invitationsSchema = {
  create: endpoint({
    method: "POST",
    path: "/api/v1/invitations",
    request: {
      body: t<CreateInvitationRequest>(),
    },
    response: { ok: t<InvitationResponse>() },
  }),

  list: endpoint({
    method: "GET",
    path: "/api/v1/invitations",
    response: { ok: t<InvitationListResponse>() },
  }),

  listPending: endpoint({
    method: "GET",
    path: "/api/v1/invitations/pending",
    response: { ok: t<InvitationListResponse>() },
  }),

  revoke: endpoint({
    method: "POST",
    path: "/api/v1/invitations/:id/revoke",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<{ message: string }>() },
  }),

  delete: endpoint({
    method: "DELETE",
    path: "/api/v1/invitations/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<void>() },
  }),
} as const;
