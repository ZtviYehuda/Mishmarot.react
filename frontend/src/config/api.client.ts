import axios from "axios";

export const API_URL = "/api";

// ── Simple in-memory cache for GET requests ───────────────────────────────────
// Avoids refetching reference data (statusTypes, structure, etc.)
// within a short window. TTL = 30 seconds.
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // ms

export function getCached<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data as T;
}

export function setCache(key: string, data: any) {
  _cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(pattern?: string) {
  if (!pattern) { _cache.clear(); return; }
  for (const key of Array.from(_cache.keys())) {
    if (key.includes(pattern)) _cache.delete(key);
  }
}

// ── Axios instance ────────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Reasonable timeout so hung requests don't block the UI
  timeout: 15_000,
});

// Request interceptor — attach token (no console.log in production)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401, no console.log spam
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
