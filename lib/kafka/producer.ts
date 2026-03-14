export async function publishEvent(topic: string, payload: Record<string, unknown>) {
  return {
    ok: true,
    topic,
    payload,
    at: new Date().toISOString(),
    mode: "stub",
  };
}
