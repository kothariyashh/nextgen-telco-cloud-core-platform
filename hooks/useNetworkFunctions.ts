"use client";

import { useApi } from "@/hooks/useApi";

export function useNetworkFunctions() {
  return useApi<{ items: Array<Record<string, unknown>> }>("/api/network-functions?limit=100");
}
