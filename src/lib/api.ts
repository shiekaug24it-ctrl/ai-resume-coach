import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const API_URL = (import.meta.env as any).VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to every request
api.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;
