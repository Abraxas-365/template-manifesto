import { endpoint, t } from "@/lib/api-client";
import type {
  AuthResponse,
  LoginInitRequest,
  LoginInitResponse,
  MeResponse,
  OtpLoginInitRequest,
  OtpLoginInitResponse,
  OtpLoginVerifyRequest,
  OtpResendRequest,
  RefreshResponse,
  TenantDiscoveryRequest,
  TenantDiscoveryResponse,
} from "./types";

export const authSchema = {
  me: endpoint({
    method: "GET",
    path: "/auth/me",
    response: { ok: t<MeResponse>() },
  }),

  login: endpoint({
    method: "POST",
    path: "/auth/login",
    request: { body: t<LoginInitRequest>() },
    response: { ok: t<LoginInitResponse>() },
  }),

  refresh: endpoint({
    method: "POST",
    path: "/auth/refresh",
    response: { ok: t<RefreshResponse>() },
  }),

  logout: endpoint({
    method: "POST",
    path: "/auth/logout",
    response: { ok: t<{ message: string }>() },
  }),

  discoverTenants: endpoint({
    method: "POST",
    path: "/auth/passwordless/tenants",
    request: { body: t<TenantDiscoveryRequest>() },
    response: { ok: t<TenantDiscoveryResponse>() },
  }),

  otpLoginInit: endpoint({
    method: "POST",
    path: "/auth/passwordless/login/initiate",
    request: { body: t<OtpLoginInitRequest>() },
    response: { ok: t<OtpLoginInitResponse>() },
  }),

  otpLoginVerify: endpoint({
    method: "POST",
    path: "/auth/passwordless/login/verify",
    request: { body: t<OtpLoginVerifyRequest>() },
    response: { ok: t<AuthResponse>() },
  }),

  otpResend: endpoint({
    method: "POST",
    path: "/auth/passwordless/resend-otp",
    request: { body: t<OtpResendRequest>() },
    response: { ok: t<{ message: string; expires_in: number }>() },
  }),
} as const;
