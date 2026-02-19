import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-utils";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        const message = extractErrorMessage(error);
        toast.error(message);
      },
    },
  },
});
