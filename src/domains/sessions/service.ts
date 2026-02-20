import { endpoint, t } from "@/lib/api-client";
import type {
  SessionDTO,
  PaginatedResponse,
  CreateSessionRequest,
  UpdateSessionRequest,
  RunResponse,
} from "./types";

export const sessionsSchema = {
  listByUser: endpoint({
    method: "GET",
    path: "/api/v1/editor/sessions",
    request: {
      query: t<{ page?: number; page_size?: number }>(),
    },
    response: { ok: t<PaginatedResponse<SessionDTO>>() },
  }),

  listByProject: endpoint({
    method: "GET",
    path: "/api/v1/editor/sessions/project/:projectId",
    request: {
      path: t<{ projectId: string }>(),
      query: t<{ page?: number; page_size?: number }>(),
    },
    response: { ok: t<PaginatedResponse<SessionDTO>>() },
  }),

  get: endpoint({
    method: "GET",
    path: "/api/v1/editor/sessions/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<SessionDTO>() },
  }),

  create: endpoint({
    method: "POST",
    path: "/api/v1/editor/sessions/project/:projectId",
    request: {
      path: t<{ projectId: string }>(),
      body: t<CreateSessionRequest>(),
    },
    response: { ok: t<SessionDTO>() },
  }),

  update: endpoint({
    method: "PUT",
    path: "/api/v1/editor/sessions/:id",
    request: {
      path: t<{ id: string }>(),
      body: t<UpdateSessionRequest>(),
    },
    response: { ok: t<SessionDTO>() },
  }),

  delete: endpoint({
    method: "DELETE",
    path: "/api/v1/editor/sessions/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<void>() },
  }),

  archive: endpoint({
    method: "POST",
    path: "/api/v1/editor/sessions/:id/archive",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<SessionDTO>() },
  }),

  clearHistory: endpoint({
    method: "DELETE",
    path: "/api/v1/editor/sessions/:id/history",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<SessionDTO>() },
  }),

  run: endpoint({
    method: "POST",
    path: "/api/v1/editor/sessions/:id/run",
    request: {
      path: t<{ id: string }>(),
      body: t<{ message: string }>(),
    },
    response: { ok: t<RunResponse>() },
  }),
} as const;
