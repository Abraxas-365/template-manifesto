import { endpoint, t } from "@/lib/api-client";
import type {
  UserListResponseDTO,
  UserResponseDTO,
  UserDetailsDTO,
  UpdateUserRequest,
  SuspendUserRequest,
  ApplyScopeTemplateRequest,
  UserScopesResponse,
  AvailableScopesResponse,
  ScopeTemplatesResponse,
  ScopeTemplateResponse,
  SetScopesRequest,
} from "./types";

export const usersSchema = {
  list: endpoint({
    method: "GET",
    path: "/api/v1/users",
    response: { ok: t<UserListResponseDTO>() },
  }),

  get: endpoint({
    method: "GET",
    path: "/api/v1/users/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<UserResponseDTO>() },
  }),

  update: endpoint({
    method: "PUT",
    path: "/api/v1/users/:id",
    request: {
      path: t<{ id: string }>(),
      body: t<UpdateUserRequest>(),
    },
    response: { ok: t<UserDetailsDTO>() },
  }),

  suspend: endpoint({
    method: "POST",
    path: "/api/v1/users/:id/suspend",
    request: {
      path: t<{ id: string }>(),
      body: t<SuspendUserRequest>(),
    },
    response: { ok: t<{ message: string }>() },
  }),

  activate: endpoint({
    method: "POST",
    path: "/api/v1/users/:id/activate",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<{ message: string }>() },
  }),

  delete: endpoint({
    method: "DELETE",
    path: "/api/v1/users/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<{ message: string }>() },
  }),

  getScopes: endpoint({
    method: "GET",
    path: "/api/v1/users/:id/scopes",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<UserScopesResponse>() },
  }),

  setScopes: endpoint({
    method: "PUT",
    path: "/api/v1/users/:id/scopes",
    request: {
      path: t<{ id: string }>(),
      body: t<SetScopesRequest>(),
    },
    response: { ok: t<{ message: string }>() },
  }),

  applyScopeTemplate: endpoint({
    method: "POST",
    path: "/api/v1/users/:id/scope-template",
    request: {
      path: t<{ id: string }>(),
      body: t<ApplyScopeTemplateRequest>(),
    },
    response: { ok: t<{ message: string }>() },
  }),

  availableScopes: endpoint({
    method: "GET",
    path: "/api/v1/scopes",
    response: { ok: t<AvailableScopesResponse>() },
  }),

  scopeTemplates: endpoint({
    method: "GET",
    path: "/api/v1/scopes/templates",
    response: { ok: t<ScopeTemplatesResponse>() },
  }),

  scopeTemplateDetails: endpoint({
    method: "GET",
    path: "/api/v1/scopes/templates/:name",
    request: {
      path: t<{ name: string }>(),
    },
    response: { ok: t<ScopeTemplateResponse>() },
  }),
} as const;
