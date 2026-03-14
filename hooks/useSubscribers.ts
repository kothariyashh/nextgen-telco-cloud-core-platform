"use client";

import { useApi } from "@/hooks/useApi";

export function useSubscribers() {
  return useApi<{ items: Array<Record<string, unknown>> }>("/api/subscribers?limit=100");
}
