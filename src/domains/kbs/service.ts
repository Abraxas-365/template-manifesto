import { endpoint, t } from "@/lib/api-client";
import type { KBDTO, PaginatedResponse, CreateKBRequest, AddTextSourceRequest } from "./types";

export const kbsSchema = {
  list: endpoint({
    method: "GET",
    path: "/api/v1/editor/kbs",
    request: {
      query: t<{ page?: number; page_size?: number }>(),
    },
    response: { ok: t<PaginatedResponse<KBDTO>>() },
  }),

  get: endpoint({
    method: "GET",
    path: "/api/v1/editor/kbs/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<KBDTO>() },
  }),

  create: endpoint({
    method: "POST",
    path: "/api/v1/editor/kbs",
    request: {
      body: t<CreateKBRequest>(),
    },
    response: { ok: t<KBDTO>() },
  }),

  delete: endpoint({
    method: "DELETE",
    path: "/api/v1/editor/kbs/:id",
    request: {
      path: t<{ id: string }>(),
    },
    response: { ok: t<void>() },
  }),

  addTextSource: endpoint({
    method: "POST",
    path: "/api/v1/kbs/:id/sources/text",
    request: {
      path: t<{ id: string }>(),
      body: t<AddTextSourceRequest>(),
    },
    response: { ok: t<KBDTO>() },
  }),

  removeSource: endpoint({
    method: "DELETE",
    path: "/api/v1/kbs/:id/sources/:sourceId",
    request: {
      path: t<{ id: string; sourceId: string }>(),
    },
    response: { ok: t<KBDTO>() },
  }),
} as const;
