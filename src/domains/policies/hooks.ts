import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";

export function usePoliciesByProject(
  projectId: string,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    ...api.policies.listByProject.$queryOptions({
      path: { projectId },
      query: { page, page_size: pageSize },
    }),
    enabled: !!projectId,
  });
}

export function usePolicy(id: string) {
  return useQuery({
    ...api.policies.get.$queryOptions({ path: { id } }),
    enabled: !!id,
  });
}

export function useGeneratePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.policies.generateFromSession.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.policies.listByProject.$key({
          path: { projectId: "" },
          query: {},
        }),
      });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.policies.update.$mutationFn(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: api.policies.get.$key({ path: { id: variables.path.id } }),
      });
      queryClient.invalidateQueries({
        queryKey: api.policies.listByProject.$key({
          path: { projectId: "" },
          query: {},
        }),
      });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.policies.delete.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.policies.listByProject.$key({
          path: { projectId: "" },
          query: {},
        }),
      });
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.policies.submitForReview.$mutationFn(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: api.policies.get.$key({ path: { id: variables.path.id } }),
      });
      queryClient.invalidateQueries({
        queryKey: api.policies.listByProject.$key({
          path: { projectId: "" },
          query: {},
        }),
      });
    },
  });
}

export function useApprovePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.policies.approve.$mutationFn(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: api.policies.get.$key({ path: { id: variables.path.id } }),
      });
      queryClient.invalidateQueries({
        queryKey: api.policies.listByProject.$key({
          path: { projectId: "" },
          query: {},
        }),
      });
    },
  });
}

export function useRetirePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.policies.retire.$mutationFn(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: api.policies.get.$key({ path: { id: variables.path.id } }),
      });
      queryClient.invalidateQueries({
        queryKey: api.policies.listByProject.$key({
          path: { projectId: "" },
          query: {},
        }),
      });
    },
  });
}
