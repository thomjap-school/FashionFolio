import axios from "axios";

const API_BASE_URL = "https://revisitable-heftier-liana.ngrok-free.dev";

export const api = axios.create({
  baseURL: API_BASE_URL
});

export function getApiBaseUrl() {
  return API_BASE_URL;
}

