#!/usr/bin/env npx tsx
/**
 * Run database migrations via Node (pg) - works when psql has network restrictions
 * Run: npm run db:migrate
 */
import "dotenv/config";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Missing DATABASE_URL in .env");
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const seedPath = path.join(process.cwd(), "supabase", "seed.sql");

const migrationFiles = [
  "202603140001_initial_schema.sql",
  "202603140002_add_session_events_tenant_id.sql",
];

async function run() {
  const client = new Client({ connectionString: dbUrl });

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
