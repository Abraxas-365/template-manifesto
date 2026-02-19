import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/domains";
import type { LoginInitRequest } from "./types";

export function useDiscoverTenants() {
  return useMutation({
    mutationFn: api.auth.discoverTenants.$mutationFn(),
  });
}

export function useOAuthLogin(redirectTo?: string) {
  const loginMutation = useMutation({
    mutationFn: api.auth.login.$mutationFn(),
  });

  const initiate = async (provider: LoginInitRequest["provider"]) => {
    const result = await loginMutation.mutateAsync({
      body: { provider },
    });
    // Store redirect URL so it survives the OAuth round-trip
    if (redirectTo) {
      sessionStorage.setItem("oauth_redirect", redirectTo);
    }
    // Backend callback now redirects directly to the frontend — no
    // need to store provider or handle a frontend callback route.
    window.location.href = result.auth_url;
  };

  return { initiate, ...loginMutation };
}

export function useOtpLoginInit() {
  return useMutation({
    mutationFn: api.auth.otpLoginInit.$mutationFn(),
  });
}

export function useOtpLoginVerify(redirectTo?: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.auth.otpLoginVerify.$mutationFn(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: api.auth.me.$key(),
      });
      await navigate({ to: redirectTo || "/" });
    },
  });
}

export function useOtpResend() {
  return useMutation({
    mutationFn: api.auth.otpResend.$mutationFn(),
  });
}
