import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";
import type { MemberListQuery, ProjectListQuery, ProjectStatus } from "./types";

// ============================================================================
// Query Hooks
// ============================================================================

export function useProjects(tenantId: string, filters?: ProjectListQuery) {
  return useQuery(
    api.projects.list.$queryOptions({
      path: { tenantId },
      query: filters ?? {},
    }),
  );
}

export function useMyProjects(
  tenantId: string,
  pagination?: { page?: number; page_size?: number },
) {
  return useQuery(
    api.projects.myProjects.$queryOptions({
      path: { tenantId },
      query: pagination ?? {},
    }),
  );
}

export function useProject(
  tenantId: string,
  projectId: string,
  options?: { withMembers?: boolean; enabled?: boolean },
) {
  return useQuery(
    api.projects.get.$queryOptions(
      {
        path: { tenantId, id: projectId },
        query: { with_members: options?.withMembers },
      },
      { enabled: options?.enabled },
    ),
  );
}

export function useProjectDetails(
  tenantId: string,
  projectId: string,
  options?: { enabled?: boolean },
) {
  return useQuery(
    api.projects.getDetails.$queryOptions(
      { path: { tenantId, id: projectId } },
      { enabled: options?.enabled },
    ),
  );
}

export function useProjectStats(
  tenantId: string,
  projectId: string,
  options?: { enabled?: boolean },
) {
  return useQuery(
    api.projects.getStats.$queryOptions(
      { path: { tenantId, id: projectId } },
      { enabled: options?.enabled },
    ),
  );
}

export function useProjectMembers(
  tenantId: string,
  projectId: string,
  query?: MemberListQuery,
) {
  return useQuery(
    api.projects.listMembers.$queryOptions({
      path: { tenantId, id: projectId },
      query: query ?? {},
    }),
  );
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateProject(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.create.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({
          path: { tenantId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.myProjects.$key({
          path: { tenantId },
          query: {},
        }),
      });
    },
  });
}

export function useUpdateProject(tenantId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.update.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.get.$key({
          path: { tenantId, id: projectId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.getDetails.$key({
          path: { tenantId, id: projectId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({
          path: { tenantId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.myProjects.$key({
          path: { tenantId },
          query: {},
        }),
      });
    },
  });
}

export function useUpdateProjectStatus(tenantId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ProjectStatus) =>
      api.projects.updateStatus({
        path: { tenantId, id: projectId },
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.get.$key({
          path: { tenantId, id: projectId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.getDetails.$key({
          path: { tenantId, id: projectId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({
          path: { tenantId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.myProjects.$key({
          path: { tenantId },
          query: {},
        }),
      });
    },
  });
}

export function useDeleteProject(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      api.projects.delete({
        path: { tenantId, id: projectId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({
          path: { tenantId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.myProjects.$key({
          path: { tenantId },
          query: {},
        }),
      });
    },
  });
}

export function useAddProjectMember(tenantId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.addMember.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.listMembers.$key({
          path: { tenantId, id: projectId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.getDetails.$key({
          path: { tenantId, id: projectId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.getStats.$key({
          path: { tenantId, id: projectId },
        }),
      });
    },
  });
}

export function useRemoveProjectMember(tenantId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      api.projects.removeMember({
        path: { tenantId, id: projectId, userId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.listMembers.$key({
          path: { tenantId, id: projectId },
          query: {},
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.getDetails.$key({
          path: { tenantId, id: projectId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: api.projects.getStats.$key({
          path: { tenantId, id: projectId },
        }),
      });
    },
  });
}
