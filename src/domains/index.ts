import {
  createApiClient,
  tokenAuth,
  HttpError,
  NetworkError,
} from "@/lib/api-client";
import { env } from "@/lib/env";
import { authSchema } from "./auth/service";
import { invitationsSchema } from "./invitations/service";
import { usersSchema } from "./users/service";

// ─── Session Expiry Handler ─────────────────────────────────────────────────

let sessionExpiryHandler: (() => void) | null = null;

export function setSessionExpiryHandler(handler: (() => void) | null) {
  sessionExpiryHandler = handler;
}

// ─── API Client ─────────────────────────────────────────────────────────────

const schema = {
  auth: authSchema,
  invitations: invitationsSchema,
  users: usersSchema,
};

const client = createApiClient({
  baseUrl: env.BACKEND_URL,
  timeoutMs: 15_000,
  credentials: "include",
  auth: tokenAuth(() => null, {
    onRefresh: async () => {
      try {
        const res = await fetch(`${env.BACKEND_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) return "retry";
        // Refresh failed — session expired.
        // Only fire the handler when AuthProvider is mounted AND
        // we're not already on /auth (avoids overwriting the redirect
        // param and showing a false "session expired" toast on the
        // login page). For the initial unauthenticated load,
        // _authenticated.beforeLoad's catch handles the redirect.
        if (
          sessionExpiryHandler &&
          !window.location.pathname.startsWith("/auth")
        ) {
          sessionExpiryHandler();
        }
        return "fail";
      } catch {
        return "fail";
      }
    },
  }),
  retry: {
    maxRetries: 2,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    shouldRetry: (error) => {
      if (error instanceof HttpError) return error.method === "GET";
      if (error instanceof NetworkError) return true;
      return false;
    },
  },
});

export const api = client.services(schema);
