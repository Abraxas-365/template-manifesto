const backendUrl = import.meta.env.VITE_BACKEND_URL;

if (typeof backendUrl !== "string" || backendUrl.trim() === "") {
  throw new Error("VITE_BACKEND_URL was not set");
}

export const env = {
  BACKEND_URL: backendUrl,
} as const;
