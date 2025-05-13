import axios, { AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    "Content-Type": "application/json",
  },
});

export const authRequest = (config: AxiosRequestConfig = {}) => {
  const token = localStorage.getItem("token");
  return api({
    ...config,
    headers: {
      ...config.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};

export default api;
