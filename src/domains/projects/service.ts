import { endpoint, t } from "@/lib/api-client";
import type {
  ProjectDTO,
  PaginatedResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  AttachKBRequest,
} from "./types";

export const projectsSchema = {
  list: endpoint({
    method: "GET",
    path: "/api/v1/editor/projects",
    request: {
      query: t<{ page?: number; page_size?: number }>(),
    },
    response: { ok: t<PaginatedResponse<ProjectDTO>>() },
  }),

  listMine: endpoint({
    method: "GET",
    path: "/api/v1/editor/projects",
    request: {
      query: t<{ mine: boolean; page?: number; page_size?: number }>(),
    },
    response: { ok: t<PaginatedResponse<ProjectDTO>>() },
  }),

  get: endpoint({
    method: "GET",
    path: "/api/v1/editor/projects/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<ProjectDTO>() },
  }),

  create: endpoint({
    method: "POST",
    path: "/api/v1/editor/projects",
    request: {
      body: t<CreateProjectRequest>(),
    },
    response: { ok: t<ProjectDTO>() },
  }),

  update: endpoint({
    method: "PUT",
    path: "/api/v1/editor/projects/:id",
    request: {
      path: t<{ id: string }>(),
      body: t<UpdateProjectRequest>(),
    },
    response: { ok: t<ProjectDTO>() },
  }),

  delete: endpoint({
    method: "DELETE",
    path: "/api/v1/editor/projects/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<void>() },
  }),

  attachKB: endpoint({
    method: "POST",
    path: "/api/v1/projects/:id/kb",
    request: {
      path: t<{ id: string }>(),
      body: t<AttachKBRequest>(),
    },
    response: { ok: t<ProjectDTO>() },
  }),

  detachKB: endpoint({
    method: "DELETE",
    path: "/api/v1/projects/:id/kb",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<ProjectDTO>() },
  }),
} as const;
