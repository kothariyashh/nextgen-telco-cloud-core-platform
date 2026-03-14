export type Row = Record<string, unknown>;

export function extractItems(data: unknown): Row[] {
  if (Array.isArray(data)) {
    return data as Row[];
  }
  if (data && typeof data === "object") {
    const maybeItems = (data as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems as Row[];
    }
    return [data as Row];
  }
  return [];
}

export function asNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function asText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function statusOf(row: Row) {
  const status = row.status ?? row.severity ?? row.state;
  return typeof status === "string" ? status : "unknown";
}

export function countBy(rows: Row[], key: string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = asText(row[key], "unknown").toLowerCase();
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
