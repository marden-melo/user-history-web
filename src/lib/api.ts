// lib/api.ts
import axios, { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

// Singleton to prevent concurrent refresh attempts
let refreshPromise: Promise<any> | null = null;

const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const authRequest = async (config: AxiosRequestConfig = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...config.headers,
    Authorization: token ? `Bearer ${token}` : "",
  };

  try {
    return await api({ ...config, headers });
  } catch (err: any) {
    if (err.response?.status === 401) {
      if (!refreshPromise) {
        refreshPromise = api
          .post("/auth/refresh", {}, { withCredentials: true })
          .then((refreshResponse) => {
            const { access_token, refresh_token } = refreshResponse.data;
            localStorage.setItem("token", access_token);

            if (refresh_token) {
              document.cookie = `refresh_token=${refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
            }
            return access_token;
          })
          .catch((refreshErr) => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            document.cookie =
              "refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
            toast.error("Sessão expirada. Faça login novamente.", {
              position: "top-right",
              autoClose: 3000,
              theme: "dark",
            });
            // Use router in a client component context or fallback
            setTimeout(() => (window.location.href = "/"), 3000);
            throw refreshErr;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      return await api({
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
    throw err;
  }
};

export default api;
