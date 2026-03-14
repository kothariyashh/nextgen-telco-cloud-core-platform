/**
 * POST /api/simulate
 * Triggers one tick of live data insertion.
 * Called by the "Simulate Live Data" button in the dashboard.
 *
 * Body (all optional):
 *   { ticks?: number }   - number of ticks to run (default 1, max 10)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TENANT_ID =
    process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "11111111-0000-0000-0000-000000000001";

function rand(min: number, max: number, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function nowIso() {
    return new Date().toISOString();
}

const NF_TYPES = ["AMF", "SMF", "UPF", "PCF", "UDM", "AUSF", "NRF"];
const SEVERITIES = ["critical", "warning", "info", "minor"] as const;
const ALARM_TYPES = ["latency_spike", "throughput_drop", "packet_loss", "cpu_high", "memory_high"];

async function runTick(
    supabase: ReturnType<typeof createClient>,
    refs: {
        nfs: Array<{ id: string; nf_type: string; name: string }>;
        sessions: Array<{ id: string }>;
        instances: Array<{ id: string }>;
        chargingSessions: Array<{ id: string; quota_used_mb: number }>;
    }
) {
    const results: string[] = [];

    const { nfs, sessions, instances, chargingSessions } = refs;

    if (!nfs.length) {
        return ["No network functions found — run db:migrate first."];
    }

    // 1. Performance metrics
    const sampledNfs = nfs.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(5, nfs.length));
    const metricRows = sampledNfs.flatMap((nf) =>
        [
            { name: "latency_ms", unit: "ms", min: 8, max: 60 },
            { name: "throughput_mbps", unit: "mbps", min: 300, max: 1100 },
            { name: "cpu_pct", unit: "percent", min: 20, max: 95 },
        ]
            .slice(0, 1 + Math.floor(Math.random() * 3))
            .map(({ name, unit, min, max }) => ({
                tenant_id: TENANT_ID,
                entity_type: "network_function",
                entity_id: nf.id,
                metric_name: name,
                metric_value: rand(min, max),
                unit,
                recorded_at: nowIso(),
            }))
    );

    const { error: pmErr } = await supabase.from("performance_metrics").insert(metricRows);
    if (!pmErr) results.push(`performance_metrics ×${metricRows.length}`);

    // 2. Metrics stream
    if (nfs.length) {
        const nf = pick(nfs);
        const streamRows = [
            { name: "latency_ms", min: 8, max: 60 },
            { name: "throughput_mbps", min: 300, max: 1200 },
        ].map(({ name, min, max }) => ({
            tenant_id: TENANT_ID,
            topic: `ngcmcp.metrics.${nf.nf_type?.toLowerCase() ?? "nf"}`,
            entity_type: "network_function",
            entity_id: nf.id,
            metric_name: name,
            metric_value: rand(min, max),
            labels: { nf_type: nf.nf_type },
            occurred_at: nowIso(),
        }));

        const { error } = await supabase.from("metrics_stream").insert(streamRows);
        if (!error) results.push(`metrics_stream ×${streamRows.length}`);
    }

    // 3. Session event
    if (sessions.length) {
        const session = pick(sessions);
        const { error } = await supabase.from("session_events").insert({
            tenant_id: TENANT_ID,
            session_id: session.id,
            event_type: pick(["qos_change", "handover", "packet_loss_spike", "qos_restore"]),
            event_data: { source: "simulator", ts: Date.now() },
            occurred_at: nowIso(),
        });
        if (!error) results.push("session_event ×1");
    }

    // 4. Log entry
    if (nfs.length) {
        const nf = pick(nfs);
        const { error } = await supabase.from("logs").insert({
            tenant_id: TENANT_ID,
            entity_type: "network_function",
            entity_id: nf.id,
            severity: pick(["info", "info", "warning", "error"]),
            message: pick([
                "NF registration success rate stable",
                "PDU session established",
                "UPF packet queue depth elevated",
                "Latency approaching SLA threshold",
                "SMF session create timeout",
            ]),
            metadata: { nf_name: nf.name, simulated: true },
            occurred_at: nowIso(),
        });
        if (!error) results.push("log ×1");
    }

    // 5. Update NF instance
    if (instances.length) {
        const inst = pick(instances);
        const { error } = await supabase
            .from("nf_instances")
            .update({ cpu_usage: rand(15, 92), memory_usage: rand(25, 88), last_heartbeat: nowIso() })
            .eq("id", inst.id);
        if (!error) results.push("nf_instance updated");
    }

    // 6. Maybe raise/clear alarm
    if (nfs.length && Math.random() < 0.4) {
        const nf = pick(nfs);
        if (Math.random() < 0.6) {
            const { error } = await supabase.from("alarms").insert({
                tenant_id: TENANT_ID,
                alarm_type: pick(ALARM_TYPES),
                severity: pick(SEVERITIES),
                source_entity_type: "network_function",
                source_entity_id: nf.id,
                description: `[Auto] alarm on ${nf.name}`,
                status: "active",
                raised_at: nowIso(),
            });
            if (!error) results.push("alarm raised");
        } else {
            const { data: oldest } = await supabase
                .from("alarms")
                .select("id")
                .eq("tenant_id", TENANT_ID)
                .eq("status", "active")
                .order("raised_at", { ascending: true })
                .limit(1)
                .maybeSingle();

            if (oldest) {
                await supabase
                    .from("alarms")
                    .update({ status: "cleared", cleared_at: nowIso() })
                    .eq("id", oldest.id);
                results.push("alarm cleared");
            }
        }
    }

    // 7. Anomaly alert (25% chance)
    if (nfs.length && Math.random() < 0.25) {
        const nf = pick(nfs);
        const { error } = await supabase.from("anomaly_alerts").insert({
            tenant_id: TENANT_ID,
            entity_type: "network_function",
            entity_id: nf.id,
            anomaly_type: pick(["latency_spike", "throughput_drop", "cpu_runaway"]),
            severity: pick(["warning", "critical"]),
            score: rand(0.65, 0.99),
            details: { baseline_ms: rand(10, 20, 1), observed_ms: rand(30, 80, 1), simulated: true },
            detected_at: nowIso(),
        });
        if (!error) results.push("anomaly_alert ×1");
    }

    // 8. AI prediction (40% chance)
    if (nfs.length && Math.random() < 0.4) {
        const nf = pick(nfs);
        const { error } = await supabase.from("ai_predictions").insert({
            tenant_id: TENANT_ID,
            prediction_type: pick(["throughput_forecast_mbps", "latency_forecast_ms", "cpu_forecast_pct"]),
            entity_type: "network_function",
            entity_id: nf.id,
            predicted_value: rand(200, 1500),
            confidence: rand(0.75, 0.97),
            predicted_for: new Date(Date.now() + rand(30, 180, 0) * 60_000).toISOString(),
            metadata: { simulated: true },
        });
        if (!error) results.push("ai_prediction ×1");
    }

    // 9. Update a charging session
    if (chargingSessions.length) {
        const cs = pick(chargingSessions);
        const deltaUsed = rand(5, 200, 1);
        const newUsed = parseFloat(((cs.quota_used_mb ?? 0) + deltaUsed).toFixed(2));
        cs.quota_used_mb = newUsed;
        const { error } = await supabase
            .from("charging_sessions")
            .update({ quota_used_mb: newUsed })
            .eq("id", cs.id);
        if (!error) results.push(`charging +${deltaUsed}MB`);
    }

    // 10. Threat alert (15% chance)
    if (Math.random() < 0.15) {
        const { error } = await supabase.from("threat_alerts").insert({
            tenant_id: TENANT_ID,
            threat_type: pick(["auth_failure_spike", "anomaly_detected", "rate_limit_breach"]),
            severity: pick(SEVERITIES),
            description: `[Simulated] Threat detected`,
            metadata: { count: Math.floor(rand(10, 200)), simulated: true },
            occurred_at: nowIso(),
        });
        if (!error) results.push("threat_alert ×1");
    }

    return results;
}

export async function POST(request: NextRequest) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        return NextResponse.json(
            { ok: false, error: "Missing Supabase environment variables." },
            { status: 500 }
        );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    let ticks = 1;
    try {
        const body = await request.json();
        ticks = Math.min(10, Math.max(1, Number(body?.ticks ?? 1)));
    } catch {
        // body not required
    }

    // Load references once
    const [nfRes, sessRes, instRes, csRes] = await Promise.all([
        supabase
            .from("network_functions")
            .select("id,nf_type,name")
            .eq("tenant_id", TENANT_ID)
            .limit(110),
        supabase
            .from("sessions")
            .select("id")
            .eq("tenant_id", TENANT_ID)
            .in("status", ["active", "idle"])
            .limit(110),
        supabase
            .from("nf_instances")
            .select("id,network_function_id")
            .eq("tenant_id", TENANT_ID)
            .limit(110),
        supabase
            .from("charging_sessions")
            .select("id,quota_used_mb")
            .eq("tenant_id", TENANT_ID)
            .limit(50),
    ]);

    const refs = {
        nfs: (nfRes.data ?? []) as Array<{ id: string; nf_type: string; name: string }>,
        sessions: (sessRes.data ?? []) as Array<{ id: string }>,
        instances: (instRes.data ?? []) as Array<{ id: string }>,
        chargingSessions: (csRes.data ?? []) as Array<{ id: string; quota_used_mb: number }>,
    };

    const allResults: string[][] = [];
    for (let i = 0; i < ticks; i++) {
        allResults.push(await runTick(supabase, refs));
    }

    return NextResponse.json({
        ok: true,
        ticks,
        inserted: allResults,
    });
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "POST to /api/simulate with optional body { ticks: number } to inject live data.",
    });
}
