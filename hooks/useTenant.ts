"use client";

import { useApi } from "@/hooks/useApi";

export function useTenant() {
  return useApi<{ tenant_id: string; role: string }>("/api/auth/session");
}
