import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("admintoken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("admintoken");
      localStorage.removeItem("adminuser");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
