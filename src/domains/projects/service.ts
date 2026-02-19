import { endpoint, t } from "@/lib/api-client";
import type {
  AddProjectMemberRequest,
  CreateProjectRequest,
  MemberListQuery,
  Paginated,
  Project,
  ProjectDetailResponse,
  ProjectListQuery,
  ProjectMember,
  ProjectStats,
  UpdateProjectRequest,
  UpdateProjectStatusRequest,
} from "./types";

export const projectsSchema = {
  create: endpoint({
    method: "POST",
    path: "/api/v1/tenant/:tenantId/projects",
    request: {
      path: t<{ tenantId: string }>(),
      body: t<CreateProjectRequest>(),
    },
    response: { ok: t<Project>() },
  }),

  list: endpoint({
    method: "GET",
    path: "/api/v1/tenant/:tenantId/projects",
    request: {
      path: t<{ tenantId: string }>(),
      query: t<ProjectListQuery>(),
    },
    response: { ok: t<Paginated<Project>>() },
  }),

  myProjects: endpoint({
    method: "GET",
    path: "/api/v1/tenant/:tenantId/projects/my-projects",
    request: {
      path: t<{ tenantId: string }>(),
      query: t<{ page?: number; page_size?: number }>(),
    },
    response: { ok: t<Paginated<Project>>() },
  }),

  get: endpoint({
    method: "GET",
    path: "/api/v1/tenant/:tenantId/projects/:id",
    request: {
      path: t<{ tenantId: string; id: string }>(),
      query: t<{ with_members?: boolean }>(),
    },
    response: { ok: t<Project>() },
  }),

  getDetails: endpoint({
    method: "GET",
    path: "/api/v1/tenant/:tenantId/projects/:id/details",
    request: {
      path: t<{ tenantId: string; id: string }>(),
    },
    response: { ok: t<ProjectDetailResponse>() },
  }),

  update: endpoint({
    method: "PUT",
    path: "/api/v1/tenant/:tenantId/projects/:id",
    request: {
      path: t<{ tenantId: string; id: string }>(),
      body: t<UpdateProjectRequest>(),
    },
    response: { ok: t<Project>() },
  }),

  updateStatus: endpoint({
    method: "PUT",
    path: "/api/v1/tenant/:tenantId/projects/:id/status",
    request: {
      path: t<{ tenantId: string; id: string }>(),
      body: t<UpdateProjectStatusRequest>(),
    },
    response: { ok: t<{ message: string; status: string }>() },
  }),

  delete: endpoint({
    method: "DELETE",
    path: "/api/v1/tenant/:tenantId/projects/:id",
    request: {
      path: t<{ tenantId: string; id: string }>(),
    },
    response: { ok: t<void>() },
  }),

  getStats: endpoint({
    method: "GET",
    path: "/api/v1/tenant/:tenantId/projects/:id/stats",
    request: {
      path: t<{ tenantId: string; id: string }>(),
    },
    response: { ok: t<ProjectStats>() },
  }),

  // Members
  listMembers: endpoint({
    method: "GET",
    path: "/api/v1/tenant/:tenantId/projects/:id/members",
    request: {
      path: t<{ tenantId: string; id: string }>(),
      query: t<MemberListQuery>(),
    },
    response: { ok: t<Paginated<ProjectMember>>() },
  }),

  addMember: endpoint({
    method: "POST",
    path: "/api/v1/tenant/:tenantId/projects/:id/members",
    request: {
      path: t<{ tenantId: string; id: string }>(),
      body: t<AddProjectMemberRequest>(),
    },
    response: { ok: t<ProjectMember>() },
  }),

  removeMember: endpoint({
    method: "DELETE",
    path: "/api/v1/tenant/:tenantId/projects/:id/members/:userId",
    request: {
      path: t<{ tenantId: string; id: string; userId: string }>(),
    },
    response: { ok: t<void>() },
  }),
} as const;
