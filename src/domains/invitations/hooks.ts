import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.invitations.create.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.invitations.list.$key({}),
      });
      queryClient.invalidateQueries({
        queryKey: api.invitations.listPending.$key({}),
      });
    },
  });
}

export function useInvitations() {
  return useQuery(api.invitations.list.$queryOptions({}));
}

export function usePendingInvitations() {
  return useQuery(api.invitations.listPending.$queryOptions({}));
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.invitations.revoke.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.invitations.list.$key({}),
      });
      queryClient.invalidateQueries({
        queryKey: api.invitations.listPending.$key({}),
      });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.invitations.delete.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.invitations.list.$key({}),
      });
      queryClient.invalidateQueries({
        queryKey: api.invitations.listPending.$key({}),
      });
    },
  });
}
