import { api } from "encore.dev/api";

interface HealthResponse {
  ok: boolean;
  service: "backend";
}

export const getHealth = api(
  { method: "GET", path: "/health", expose: true },
  async (): Promise<HealthResponse> => {
    return { ok: true, service: "backend" };
  },
);
