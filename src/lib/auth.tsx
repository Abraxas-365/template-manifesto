import { createContext, use, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { api, setSessionExpiryHandler } from "@/domains";
import type { UserDTO, TenantDTO } from "@/domains/auth/types";

interface AuthContextValue {
  user: UserDTO | null;
  tenant: TenantDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      queryClient.clear();
      toast.error("Your session has expired. Please sign in again.");
      void navigate({
        to: "/auth",
        search: { redirect: window.location.pathname },
      });
    };
    setSessionExpiryHandler(handler);
    return () => setSessionExpiryHandler(null);
  }, [queryClient, navigate]);

  const { data, isLoading } = useQuery({
    ...api.auth.me.$queryOptions(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Proceed with local cleanup even if the server call fails
    }
    queryClient.clear();
    await navigate({ to: "/auth" });
  };

  return (
    <AuthContext
      value={{
        user: data?.user ?? null,
        tenant: data?.tenant ?? null,
        isAuthenticated: !!data?.user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
