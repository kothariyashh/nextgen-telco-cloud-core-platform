const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export type RequiredEnv = (typeof requiredVars)[number];

export function getEnv(name: RequiredEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function hasSupabaseEnv() {
  return requiredVars.every((key) => Boolean(process.env[key]));
}

export function getDefaultTenantId() {
  return process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? null;
}
