"use client";

import { useApi } from "@/hooks/useApi";

export function useMetrics() {
  return useApi<{ items: Array<Record<string, unknown>> }>("/api/monitoring/metrics?limit=200");
}
