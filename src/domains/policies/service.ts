import { endpoint, t } from "@/lib/api-client";
import type {
  PolicyDTO,
  PaginatedResponse,
  UpdatePolicyRequest,
  PublishPolicyRequest,
  GenerateFromSessionRequest,
} from "./types";

export const policiesSchema = {
  generateFromSession: endpoint({
    method: "POST",
    path: "/api/v1/editor/policies/generate/:sessionId",
    request: {
      path: t<{ sessionId: string }>(),
      body: t<GenerateFromSessionRequest>(),
    },
    response: { ok: t<PolicyDTO>() },
  }),

  list: endpoint({
    method: "GET",
    path: "/api/v1/editor/policies",
    request: {
      query: t<{ page?: number; page_size?: number }>(),
    },
    response: { ok: t<PaginatedResponse<PolicyDTO>>() },
  }),

  listByProject: endpoint({
    method: "GET",
    path: "/api/v1/editor/policies/project/:projectId",
    request: {
      path: t<{ projectId: string }>(),
      query: t<{ page?: number; page_size?: number }>(),
    },
    response: { ok: t<PaginatedResponse<PolicyDTO>>() },
  }),

  get: endpoint({
    method: "GET",
    path: "/api/v1/editor/policies/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<PolicyDTO>() },
  }),

  update: endpoint({
    method: "PUT",
    path: "/api/v1/editor/policies/:id",
    request: {
      path: t<{ id: string }>(),
      body: t<UpdatePolicyRequest>(),
    },
    response: { ok: t<PolicyDTO>() },
  }),

  delete: endpoint({
    method: "DELETE",
    path: "/api/v1/editor/policies/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<void>() },
  }),

  submitForReview: endpoint({
    method: "POST",
    path: "/api/v1/editor/policies/:id/submit",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<PolicyDTO>() },
  }),

  approve: endpoint({
    method: "POST",
    path: "/api/v1/editor/policies/:id/approve",
    request: {
      path: t<{ id: string }>(),
      body: t<PublishPolicyRequest>(),
    },
    response: { ok: t<PolicyDTO>() },
  }),

  retire: endpoint({
    method: "POST",
    path: "/api/v1/editor/policies/:id/retire",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<PolicyDTO>() },
  }),
} as const;
