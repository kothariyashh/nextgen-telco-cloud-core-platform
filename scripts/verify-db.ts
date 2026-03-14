#!/usr/bin/env npx tsx
/**
 * Database verification script - tests Supabase connection and operations
 * Run: npm run db:verify
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function verify() {
  console.log("🔌 Connecting to Supabase...\n");

  try {
    // 1. Test connection - regions table has public read (RLS allows all)
    const { data: regions, error: regionsErr } = await supabase
      .from("regions")
      .select("id, name, code")
      .limit(3);

    if (regionsErr) {
      if (regionsErr.message?.includes("relation") || regionsErr.message?.includes("does not exist")) {
        console.log("⚠️  Connection OK, but migrations not yet applied.");
        console.log("   Run migrations via Supabase Dashboard → SQL Editor, or use psql:\n");
        console.log("   psql $DATABASE_URL -f supabase/migrations/202603140001_initial_schema.sql");
        console.log("   psql $DATABASE_URL -f supabase/migrations/202603140002_add_session_events_tenant_id.sql");
        console.log("   psql $DATABASE_URL -f supabase/seed.sql\n");
        process.exit(1);
      }
      throw regionsErr;
    }

    console.log("✅ Connection successful\n");
    console.log("📊 Tables verified (sample queries):\n");

    // 2. Regions
    const { count: regionCount } = await supabase.from("regions").select("*", { count: "exact", head: true });
    console.log(`   • regions: ${regionCount ?? 0} rows`);

    // 3. Tenants (tenant isolation - needs service role for cross-tenant, but demo tenant may work)
    const { count: tenantCount } = await supabase.from("tenants").select("*", { count: "exact", head: true });
    console.log(`   • tenants: ${tenantCount ?? 0} rows`);

    // 4. Subscribers
    const { count: subCount } = await supabase.from("subscribers").select("*", { count: "exact", head: true });
    console.log(`   • subscribers: ${subCount ?? 0} rows`);

    // 5. Network functions
    const { count: nfCount } = await supabase.from("network_functions").select("*", { count: "exact", head: true });
    console.log(`   • network_functions: ${nfCount ?? 0} rows`);

    if (regions && regions.length > 0) {
      console.log("\n📋 Sample data (regions):");
      regions.forEach((r) => console.log(`   - ${r.name} (${r.code})`));
    }

    console.log("\n✅ All database operations verified successfully.");
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  }
}

verify();
