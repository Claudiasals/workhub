export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api/v1" : "http://127.0.0.1:3030/api/v1");
