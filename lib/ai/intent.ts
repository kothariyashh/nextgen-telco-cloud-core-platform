export function extractIntent(prompt: string) {
  const lower = prompt.toLowerCase();
  const action = lower.includes("increase") || lower.includes("scale") ? "scale" : "analyze";
  const target = lower.includes("slice") ? "slice" : lower.includes("upf") ? "network_function" : "network";
  const amount = Number(lower.match(/(\d+)%/)?.[1] ?? 0);

  return {
    action,
    target,
    amount_percent: amount,
    raw_prompt: prompt,
  };
}
