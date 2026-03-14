#!/usr/bin/env npx tsx
/**
 * NGCMCP Seed-only runner
 * Runs seed.sql (and seed_fake_100.sql if present) without re-running migrations.
 *
 * Run: npm run db:seed
 */
import "dotenv/config";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dns from "node:dns";

const dbUrl = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌ Missing DATABASE_URL in .env");
    process.exit(1);
}

const seedPath = path.join(process.cwd(), "supabase", "seed.sql");
const fakeSeedPath = path.join(process.cwd(), "supabase", "seed_fake_100.sql");

function getConnectionConfig(url: string): Promise<{ connectionString: string }> {
    const parsed = new URL(url);
    const host = parsed.hostname;

    if (host.includes("pooler.supabase.com")) {
        return Promise.resolve({ connectionString: url });
    }

    return dns.promises.resolve4(host).then(
        (addrs) => {
            if (addrs.length === 0) throw new Error(`No IPv4 address for ${host}`);
            parsed.hostname = addrs[0];
            return { connectionString: parsed.toString() };
        },
        (err: NodeJS.ErrnoException) => {
            if (err.code === "ENODATA" || err.code === "ENOTFOUND") {
                throw new Error(`Host ${host} has no IPv4 records. Use the Connection Pooler URL.`);
            }
            throw err;
        }
    );
}

async function run() {
    const config = await getConnectionConfig(dbUrl as string);
    const client = new Client(config);

    try {
        console.log("🔌 Connecting to database...\n");
        await client.connect();
        console.log("✅ Connected.\n");

        if (fs.existsSync(seedPath)) {
            console.log("📄 Running seed.sql...");
            await client.query(fs.readFileSync(seedPath, "utf8"));
            console.log("   ✓ Done.\n");
        } else {
            console.warn("⚠️  supabase/seed.sql not found, skipping.");
        }

        if (fs.existsSync(fakeSeedPath)) {
            console.log("📄 Running seed_fake_100.sql (100 records per component)...");
            await client.query(fs.readFileSync(fakeSeedPath, "utf8"));
            console.log("   ✓ Done.\n");
        }

        console.log("✅ Seed completed successfully.");
    } catch (err) {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
