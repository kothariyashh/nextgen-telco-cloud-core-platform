import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const checks = [
  "tenants",
  "user_profiles",
  "network_functions",
  "subscribers",
  "network_slices",
  "sessions",
  "policy_rules",
  "cdr_records",
  "alerts",
  "alarms",
  "model_registry",
  "marketplace_packages",
];

for (const table of checks) {
  const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
  if (error) {
    console.error(`Table check failed for ${table}: ${error.message}`);
    process.exit(1);
  }
}

const { data: tenants, error: tenantErr } = await supabase.from("tenants").select("id,name,slug").limit(5);
if (tenantErr) {
  console.error(`Tenant read failed: ${tenantErr.message}`);
  process.exit(1);
}

console.log("DB probe passed. Tenant sample:");
console.log(JSON.stringify(tenants ?? [], null, 2));
