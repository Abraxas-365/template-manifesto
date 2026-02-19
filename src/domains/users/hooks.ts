import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";

export function useTeamMembers() {
  return useQuery(api.users.list.$queryOptions({}));
}

export function useUser(id: string) {
  return useQuery({
    ...api.users.get.$queryOptions({ path: { id } }),
    enabled: !!id,
  });
}

export function useUserScopes(id: string) {
  return useQuery({
    ...api.users.getScopes.$queryOptions({ path: { id } }),
    enabled: !!id,
  });
}

export function useAvailableScopes() {
  return useQuery(api.users.availableScopes.$queryOptions({}));
}

export function useScopeTemplates() {
  return useQuery(api.users.scopeTemplates.$queryOptions({}));
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.update.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.users.list.$key({}),
      });
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.suspend.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.users.list.$key({}),
      });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.activate.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.users.list.$key({}),
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.delete.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.users.list.$key({}),
      });
    },
  });
}

export function useApplyScopeTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.applyScopeTemplate.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.users.list.$key({}),
      });
    },
  });
}
