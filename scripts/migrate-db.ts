#!/usr/bin/env npx tsx
/**
 * Run database migrations via Node (pg) - works when psql has network restrictions
 * Run: npm run db:migrate
 */
import "dotenv/config";
import * as dns from "node:dns";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

// Prefer pooler URL if set (avoids IPv6 ENETUNREACH on direct db.*.supabase.co)
const dbUrl = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Missing DATABASE_URL in .env");
  process.exit(1);
}
const resolvedDbUrl: string = dbUrl;

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const seedPath = path.join(process.cwd(), "supabase", "seed.sql");

const migrationFiles = [
  "202603140001_initial_schema.sql",
  "202603140002_add_session_events_tenant_id.sql",
  "202603140003_add_configurations.sql",
];

function getConnectionConfig(url: string): Promise<{ connectionString: string }> {
  const parsed = new URL(url);
  const host = parsed.hostname;

  // Pooler host (*.pooler.supabase.com) has IPv4; use directly
  if (host.includes("pooler.supabase.com")) {
    return Promise.resolve({ connectionString: url });
  }

  // Direct db.*.supabase.co is often IPv6-only; force IPv4 if A records exist
  return dns.promises.resolve4(host).then(
    (addrs) => {
      if (addrs.length === 0) throw new Error(`No IPv4 address for ${host}`);
      parsed.hostname = addrs[0];
      return { connectionString: parsed.toString() };
    },
    (err: NodeJS.ErrnoException) => {
      if (err.code === "ENODATA" || err.code === "ENOTFOUND") {
        throw new Error(
          `Host ${host} has no IPv4 records (IPv6-only). Use the Connection Pooler URL instead:\n` +
            `  1. Supabase Dashboard → Settings → Database\n` +
            `  2. Connection string → "Transaction" (port 6543)\n` +
            `  3. Set DATABASE_URL or DATABASE_URL_POOLER to that URI in .env`
        );
      }
      throw err;
    }
  );
}

async function run() {
  const config = await getConnectionConfig(resolvedDbUrl);
  const client = new Client(config);

  try {
    console.log("🔌 Connecting to database...\n");
    await client.connect();
    console.log("✅ Connected.\n");

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        process.exit(1);
      }
      const sql = fs.readFileSync(filePath, "utf8");
      console.log(`📄 Running ${file}...`);
      await client.query(sql);
      console.log(`   ✓ Done.\n`);
    }

    if (fs.existsSync(seedPath)) {
      console.log("📄 Running seed.sql...");
      const seedSql = fs.readFileSync(seedPath, "utf8");
      await client.query(seedSql);
      console.log("   ✓ Done.\n");
    }

    console.log("✅ All migrations and seed completed successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
