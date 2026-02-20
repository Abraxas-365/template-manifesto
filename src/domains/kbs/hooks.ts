import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";

export function useKnowledgeBases(page = 1, pageSize = 20) {
  return useQuery(
    api.kbs.list.$queryOptions({ query: { page, page_size: pageSize } }),
  );
}

export function useKnowledgeBase(id: string) {
  return useQuery({
    ...api.kbs.get.$queryOptions({ path: { id } }),
    enabled: !!id,
  });
}

export function useCreateKB() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.kbs.create.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.kbs.list.$key({ query: {} }),
      });
    },
  });
}

export function useDeleteKB() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.kbs.delete.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.kbs.list.$key({ query: {} }),
      });
    },
  });
}

export function useAddTextSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.kbs.addTextSource.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.kbs.list.$key({ query: {} }),
      });
    },
  });
}

export function useRemoveKBSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.kbs.removeSource.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.kbs.list.$key({ query: {} }),
      });
    },
  });
}
