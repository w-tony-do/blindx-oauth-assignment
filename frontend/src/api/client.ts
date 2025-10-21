import { contract } from "@contract";
import { initClient } from "@ts-rest/core";

export const apiClient = initClient(contract, {
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  baseHeaders: {
    "Content-Type": "application/json",
  },
});
