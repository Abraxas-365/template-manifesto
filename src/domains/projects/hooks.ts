import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/domains";

export function useProjects(page = 1, pageSize = 20) {
  return useQuery(
    api.projects.list.$queryOptions({ query: { page, page_size: pageSize } }),
  );
}

export function useMyProjects(page = 1, pageSize = 20) {
  return useQuery(
    api.projects.listMine.$queryOptions({
      query: { mine: true, page, page_size: pageSize },
    }),
  );
}

export function useProject(id: string) {
  return useQuery({
    ...api.projects.get.$queryOptions({ path: { id } }),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.create.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({ query: {} }),
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.update.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({ query: {} }),
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.delete.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({ query: {} }),
      });
    },
  });
}

export function useAttachKB() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.attachKB.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({ query: {} }),
      });
    },
  });
}

export function useDetachKB() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.projects.detachKB.$mutationFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.projects.list.$key({ query: {} }),
      });
    },
  });
}
