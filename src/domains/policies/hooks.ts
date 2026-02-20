import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";

function invalidatePolicyLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: api.policies.list.$key({ query: {} }),
  });
  queryClient.invalidateQueries({
    queryKey: api.policies.listByProject.$key({
      path: { projectId: "" },
      query: {},
    }),
  });
}

export function usePolicies(page = 1, pageSize = 20) {
  return useQuery({
    ...api.policies.list.$queryOptions({
      query: { page, page_size: pageSize },
    }),
  });
}

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
      invalidatePolicyLists(queryClient);
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
      invalidatePolicyLists(queryClient);
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.policies.delete.$mutationFn(),
    onSuccess: () => {
      invalidatePolicyLists(queryClient);
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
      invalidatePolicyLists(queryClient);
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
      invalidatePolicyLists(queryClient);
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
      invalidatePolicyLists(queryClient);
    },
  });
}
