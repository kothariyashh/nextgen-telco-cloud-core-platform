"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useRealtime(options: {
  channel: string;
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  onEvent: (payload: unknown) => void;
  tenantId?: string;
}) {
  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient();
      const channel = client
        .channel(options.channel)
        .on(
          "postgres_changes",
          {
            event: options.event ?? "*",
            schema: "public",
            table: options.table,
            filter: options.tenantId ? `tenant_id=eq.${options.tenantId}` : undefined,
          },
          options.onEvent,
        )
        .subscribe();

      return () => {
        void client.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  }, [options]);
}
