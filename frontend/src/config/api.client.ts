import axios from "axios";

// Ensure this matches your backend URL (Backend must be running!)
// detect the base URL dynamically for network / ngrok access
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // If we are on mobile/ngrok, window.location.hostname will be the local IP or ngrok address
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // In dev mode with Vite proxy, we can just use /api
    return `${protocol}//${hostname}${window.location.port ? ":" + window.location.port : ""}/api`;
  }
  return "http://localhost:5000/api";
};

export const API_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Automatically add the Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `[API] ${config.method?.toUpperCase()} ${config.url} - Token attached`,
      );
    } else {
      console.log(
        `[API] ${config.method?.toUpperCase()} ${config.url} - No token`,
      );
    }
    return config;
  },
  (error) => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  },
);

// 2. Response Interceptor: Handle 401 (Logout if token expires)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error(
      `[API] Error: ${error.response?.status} ${error.config?.url}`,
      error.response?.data,
    );
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
