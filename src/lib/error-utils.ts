import {
  HttpError,
  NetworkError,
  TimeoutError,
  ApiError,
} from "@/lib/api-client";

export function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    const body = error.errorBody;
    if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as Record<string, unknown>).message === "string"
    ) {
      return (body as Record<string, unknown>).message as string;
    }
    return `Request failed (${error.status})`;
  }
  if (error instanceof NetworkError)
    return "Network error. Please check your connection.";
  if (error instanceof TimeoutError)
    return "Request timed out. Please try again.";
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
