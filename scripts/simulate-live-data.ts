#!/usr/bin/env npx tsx
/**
 * NGCMCP Live Data Simulator
 * Continuously inserts realistic telemetry data into the Supabase database
 * so all dashboard views show live, changing data.
 *
 * Run: npm run db:simulate
 *
 * What this inserts every tick:
 *  - performance_metrics  (latency, throughput, cpu, memory per NF)
 *  - session_events       (qos_change, handover events on active sessions)
 *  - logs                 (info/warning/error from NFs)
 *  - alarms               (random raise/clear cycle)
 *  - anomaly_alerts       (probabilistic spikes)
 *  - ai_predictions       (rolling forecasts)
 *  - metrics_stream       (high-frequency streaming metrics)
 *  - nf_instances         (cpu/memory updates)
 *  - charging_sessions    (quota_used increment)
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "11111111-0000-0000-0000-000000000001";

// How often (ms) to insert a batch of live data
const TICK_INTERVAL_MS = parseInt(process.env.SIMULATE_INTERVAL_MS ?? "4000", 10);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function rand(min: number, max: number, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function nowIso() {
    return new Date().toISOString();
}

function minutesAgo(n: number) {
    return new Date(Date.now() - n * 60_000).toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch seed references (NFs, slices, subscribers, sessions)
// ─────────────────────────────────────────────────────────────────────────────
type NfRow = { id: string; nf_type: string; name: string };
type SliceRow = { id: string };
type SubscriberRow = { id: string };
type SessionRow = { id: string; tenant_id: string; subscriber_id: string };
type NfInstanceRow = { id: string; network_function_id: string };
type ChargingSessionRow = { id: string; quota_used_mb: number };

let nfs: NfRow[] = [];
let slices: SliceRow[] = [];
let subscribers: SubscriberRow[] = [];
let activeSessions: SessionRow[] = [];
let nfInstances: NfInstanceRow[] = [];
let chargingSessions: ChargingSessionRow[] = [];
let tickCount = 0;

async function loadReferences() {
    const [nfRes, sliceRes, subRes, sessRes, instRes, csRes] = await Promise.all([
        supabase.from("network_functions").select("id,nf_type,name").eq("tenant_id", TENANT_ID).limit(110),
        supabase.from("network_slices").select("id").eq("tenant_id", TENANT_ID).limit(110),
        supabase.from("subscribers").select("id").eq("tenant_id", TENANT_ID).limit(110),
        supabase
            .from("sessions")
            .select("id,tenant_id,subscriber_id")
            .eq("tenant_id", TENANT_ID)
            .in("status", ["active", "idle"])
            .limit(110),
        supabase.from("nf_instances").select("id,network_function_id").eq("tenant_id", TENANT_ID).limit(110),
        supabase.from("charging_sessions").select("id,quota_used_mb").eq("tenant_id", TENANT_ID).limit(50),
    ]);

    nfs = (nfRes.data ?? []) as NfRow[];
    slices = (sliceRes.data ?? []) as SliceRow[];
    subscribers = (subRes.data ?? []) as SubscriberRow[];
    activeSessions = (sessRes.data ?? []) as SessionRow[];
    nfInstances = (instRes.data ?? []) as NfInstanceRow[];
    chargingSessions = (csRes.data ?? []) as ChargingSessionRow[];

    console.log(
        `📋 Loaded references: ${nfs.length} NFs, ${slices.length} slices, ` +
        `${subscribers.length} subscribers, ${activeSessions.length} sessions, ` +
        `${nfInstances.length} instances, ${chargingSessions.length} charging sessions`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tick functions — each inserts a small realistic batch
// ─────────────────────────────────────────────────────────────────────────────

async function insertPerformanceMetrics() {
    if (!nfs.length) return;

    const metricDefs: Array<[string, string, number, number]> = [
        ["latency_ms", "ms", 8, 55],
        ["throughput_mbps", "mbps", 400, 1100],
        ["cpu_pct", "percent", 20, 90],
        ["memory_pct", "percent", 30, 85],
        ["packet_loss_pct", "percent", 0, 2.5],
        ["session_count", "count", 100, 2500],
        ["error_rate_pct", "percent", 0, 5],
    ];

    // Pick 3-6 random NFs and 2-3 random metrics each
    const sampledNfs = nfs.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(6, nfs.length));
    const rows = sampledNfs.flatMap((nf) => {
        const metrics = metricDefs.slice().sort(() => Math.random() - 0.5).slice(0, 3);
        return metrics.map(([name, unit, min, max]) => ({
            tenant_id: TENANT_ID,
            entity_type: "network_function",
            entity_id: nf.id,
            metric_name: name,
            metric_value: rand(min, max),
            unit,
            recorded_at: nowIso(),
        }));
    });

    const { error } = await supabase.from("performance_metrics").insert(rows);
    if (error) console.warn("⚠️  performance_metrics:", error.message);
    else console.log(`  ✓ performance_metrics ×${rows.length}`);
}

async function insertMetricsStream() {
    if (!nfs.length) return;

    const nf = pick(nfs);
    const metricPairs: Array<[string, number, number]> = [
        ["latency_ms", 8, 60],
        ["throughput_mbps", 300, 1200],
        ["cpu_pct", 15, 95],
        ["pdu_sessions", 100, 3000],
    ];

    const rows = metricPairs.slice(0, 2 + Math.floor(Math.random() * 3)).map(([name, min, max]) => ({
        tenant_id: TENANT_ID,
        topic: `ngcmcp.metrics.${nf.nf_type?.toLowerCase() ?? "nf"}`,
        entity_type: "network_function",
        entity_id: nf.id,
        metric_name: name,
        metric_value: rand(min, max),
        labels: { nf_type: nf.nf_type, nf_name: nf.name },
        occurred_at: nowIso(),
    }));

    const { error } = await supabase.from("metrics_stream").insert(rows);
    if (error) console.warn("⚠️  metrics_stream:", error.message);
    else console.log(`  ✓ metrics_stream ×${rows.length}`);
}

async function insertSessionEvents() {
    if (!activeSessions.length) return;

    const session = pick(activeSessions);
    const eventType = pick(["qos_change", "handover", "packet_loss_spike", "qos_restore", "tunnel_update"]);
    const eventData =
        eventType === "qos_change"
            ? { from: pick(["QCI-9", "QCI-7"]), to: pick(["QCI-5", "QCI-7", "QCI-9"]) }
            : eventType === "handover"
                ? { source_amf: "AMF-Mumbai-01", target_amf: pick(["AMF-Frankfurt-01", "AMF-Singapore-01"]), latency_added_ms: rand(5, 25) }
                : eventType === "packet_loss_spike"
                    ? { loss_pct: rand(0.5, 3.5), duration_ms: rand(200, 2000) }
                    : { seq: tickCount, ok: true };

    const { error } = await supabase.from("session_events").insert({
        tenant_id: TENANT_ID,
        session_id: session.id,
        event_type: eventType,
        event_data: eventData,
        occurred_at: nowIso(),
    });
    if (error) console.warn("⚠️  session_events:", error.message);
    else console.log(`  ✓ session_event: ${eventType}`);
}

async function insertLogs() {
    if (!nfs.length) return;

    const logTemplates: Array<[string, string, Record<string, unknown>]> = [
        ["info", "NF registration success rate stable", { rate: rand(99.1, 99.99) }],
        ["info", "PDU session established", { session_count: Math.floor(rand(200, 3000)) }],
        ["warning", "UPF packet queue depth elevated", { depth: Math.floor(rand(800, 3500)) }],
        ["warning", "Latency approaching SLA threshold", { current_ms: rand(40, 60), sla_ms: 50 }],
        ["error", "SMF session create timeout", { attempts: Math.floor(rand(1, 4)), last_error: "timeout" }],
        ["debug", "NF heartbeat received", { tick: tickCount }],
        ["info", "Slice bandwidth utilisation update", { utilisation_pct: rand(40, 95) }],
        ["warning", "High CPU on network function", { cpu_pct: rand(80, 98) }],
        ["error", "Authentication failure spike detected", { failures: Math.floor(rand(20, 100)) }],
    ];

    const count = 1 + Math.floor(Math.random() * 3);
    const nf = pick(nfs);
    const rows = Array.from({ length: count }).map(() => {
        const [severity, message, meta] = pick(logTemplates);
        return {
            tenant_id: TENANT_ID,
            entity_type: "network_function",
            entity_id: nf.id,
            severity,
            message,
            metadata: { ...meta, nf_name: nf.name, tick: tickCount },
            occurred_at: nowIso(),
        };
    });

    const { error } = await supabase.from("logs").insert(rows);
    if (error) console.warn("⚠️  logs:", error.message);
    else console.log(`  ✓ logs ×${rows.length}`);
}

async function updateNfInstances() {
    if (!nfInstances.length) return;

    const inst = pick(nfInstances);
    const { error } = await supabase
        .from("nf_instances")
        .update({
            cpu_usage: rand(15, 92),
            memory_usage: rand(25, 88),
            last_heartbeat: nowIso(),
        })
        .eq("id", inst.id);
    if (error) console.warn("⚠️  nf_instances update:", error.message);
    else console.log(`  ✓ nf_instance updated`);
}

async function maybeRaiseOrClearAlarm() {
    if (!nfs.length) return;

    // 30% chance to raise an alarm, 20% chance to clear one
    const roll = Math.random();
    if (roll < 0.30) {
        const nf = pick(nfs);
        const alarmTypes = ["latency_spike", "throughput_drop", "packet_loss", "cpu_high", "memory_high", "link_failure"];
        const severities = ["critical", "warning", "warning", "minor"];

        const alarmType = pick(alarmTypes);
        const severity = pick(severities);

        const { error } = await supabase.from("alarms").insert({
            tenant_id: TENANT_ID,
            alarm_type: alarmType,
            severity,
            source_entity_type: "network_function",
            source_entity_id: nf.id,
            description: `[Auto] ${alarmType.replace(/_/g, " ")} on ${nf.name}`,
            status: "active",
            raised_at: nowIso(),
        });
        if (error) console.warn("⚠️  alarm raise:", error.message);
        else console.log(`  ✓ alarm raised: ${alarmType} (${severity})`);
    } else if (roll < 0.50) {
        // Clear the oldest active alarm
        const { data: oldest } = await supabase
            .from("alarms")
            .select("id")
            .eq("tenant_id", TENANT_ID)
            .eq("status", "active")
            .order("raised_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (oldest) {
            const { error } = await supabase
                .from("alarms")
                .update({ status: "cleared", cleared_at: nowIso() })
                .eq("id", oldest.id);
            if (error) console.warn("⚠️  alarm clear:", error.message);
            else console.log(`  ✓ alarm cleared`);
        }
    }
}

async function maybeInsertAnomalyAlert() {
    if (!nfs.length || Math.random() > 0.25) return;

    const nf = pick(nfs);
    const anomalyTypes = ["latency_spike", "throughput_drop", "memory_leak", "cpu_runaway", "packet_loss_burst"];

    const { error } = await supabase.from("anomaly_alerts").insert({
        tenant_id: TENANT_ID,
        entity_type: "network_function",
        entity_id: nf.id,
        anomaly_type: pick(anomalyTypes),
        severity: pick(["warning", "critical", "info"]),
        score: rand(0.65, 0.99),
        details: {
            baseline_ms: rand(10, 20, 1),
            observed_ms: rand(30, 80, 1),
            window_s: 60,
            tick: tickCount,
        },
        detected_at: nowIso(),
    });
    if (error) console.warn("⚠️  anomaly_alert:", error.message);
    else console.log(`  ✓ anomaly_alert inserted`);
}

async function updateAiPredictions() {
    if (!nfs.length || Math.random() > 0.4) return;

    const nf = pick(nfs);
    const predictionTypes = [
        "throughput_forecast_mbps",
        "latency_forecast_ms",
        "session_count_forecast",
        "cpu_forecast_pct",
    ];

    const { error } = await supabase.from("ai_predictions").insert({
        tenant_id: TENANT_ID,
        prediction_type: pick(predictionTypes),
        entity_type: "network_function",
        entity_id: nf.id,
        predicted_value: rand(200, 1500),
        confidence: rand(0.75, 0.97),
        predicted_for: new Date(Date.now() + rand(30, 180, 0) * 60_000).toISOString(),
        metadata: { window: "30m", model: "LatencySpikeDetector", tick: tickCount },
    });
    if (error) console.warn("⚠️  ai_predictions:", error.message);
    else console.log(`  ✓ ai_prediction inserted`);
}

async function updateChargingSessions() {
    if (!chargingSessions.length) return;

    const cs = pick(chargingSessions);
    const deltaUsed = rand(5, 200, 1); // MB consumed this tick
    const newUsed = parseFloat(((cs.quota_used_mb ?? 0) + deltaUsed).toFixed(2));

    const { error } = await supabase
        .from("charging_sessions")
        .update({ quota_used_mb: newUsed })
        .eq("id", cs.id);

    // Refresh the local list so next tick has updated values
    cs.quota_used_mb = newUsed;

    if (error) console.warn("⚠️  charging_sessions update:", error.message);
    else console.log(`  ✓ charging_session quota_used updated (+${deltaUsed} MB)`);
}

async function maybeInsertThreatAlert() {
    if (Math.random() > 0.15) return;

    const types = ["auth_failure_spike", "anomaly_detected", "rate_limit_breach", "suspicious_source", "ddos_probe"];
    const { error } = await supabase.from("threat_alerts").insert({
        tenant_id: TENANT_ID,
        threat_type: pick(types),
        severity: pick(["warning", "critical", "info"]),
        description: `[Simulated] Threat detected at tick #${tickCount}`,
        metadata: { count: Math.floor(rand(10, 200)), window_min: pick([1, 5, 15]) },
        occurred_at: nowIso(),
    });
    if (error) console.warn("⚠️  threat_alerts:", error.message);
    else console.log(`  ✓ threat_alert inserted`);
}

async function maybeUpdateOptimizationRecommendation() {
    if (!nfs.length || Math.random() > 0.2) return;

    const nf = pick(nfs);
    const status = pick(["pending", "applied", "rejected"]);

    await supabase.from("optimization_recommendations").insert({
        tenant_id: TENANT_ID,
        title: `Scale ${nf.nf_type} by ${pick(["+1", "+2", "-1"])} replica`,
        description: `Predicted load change warrants scaling action.`,
        recommendation_type: pick(["capacity_scale", "config_tune", "failover"]),
        target_type: "network_function",
        target_id: nf.id,
        payload: { replicas: Math.floor(rand(1, 5, 0)), tick: tickCount },
        status,
    });

    console.log(`  ✓ optimization_recommendation: ${status}`);
}

async function insertOrchestrationJob() {
    if (!nfs.length || Math.random() > 0.15) return;

    const nf = pick(nfs);
    const jobTypes = ["deploy", "scale", "restart", "config_update", "health_check"];
    const statuses = ["queued", "running", "completed", "failed"];

    const { error } = await supabase.from("orchestration_jobs").insert({
        tenant_id: TENANT_ID,
        job_type: pick(jobTypes),
        target_type: "network_function",
        target_id: nf.id,
        payload: { replicas: Math.floor(rand(1, 5, 0)), initiated_by: "simulator" },
        status: pick(statuses),
    });
    if (error) console.warn("⚠️  orchestration_jobs:", error.message);
    else console.log(`  ✓ orchestration_job inserted`);
}

async function insertTraceAndSpan() {
    if (Math.random() > 0.2) return;

    const service = pick(["AMF", "SMF", "UPF", "PCF", "UDM"]);
    const durationMs = rand(50, 600, 1);
    const startTime = new Date(Date.now() - durationMs).toISOString();
    const endTime = nowIso();
    const status = rand(0, 1) > 0.9 ? "error" : "ok";

    const { data: trace, error: traceErr } = await supabase
        .from("traces")
        .insert({
            tenant_id: TENANT_ID,
            trace_name: `${service} Flow #${tickCount}`,
            root_service: service,
            status,
            started_at: startTime,
            ended_at: endTime,
            duration_ms: durationMs,
        })
        .select("id")
        .single();

    if (traceErr || !trace) {
        console.warn("⚠️  trace:", traceErr?.message);
        return;
    }

    const spanCount = 2 + Math.floor(Math.random() * 3);
    const spans = Array.from({ length: spanCount }).map((_, i) => ({
        tenant_id: TENANT_ID,
        trace_id: trace.id,
        span_name: `${service}.Op${i + 1}`,
        service_name: service,
        started_at: new Date(Date.now() - durationMs + i * 50).toISOString(),
        ended_at: new Date(Date.now() - durationMs + (i + 1) * 50).toISOString(),
        duration_ms: rand(20, 120, 1),
        status: i === spanCount - 1 && status === "error" ? "error" : "ok",
        metadata: { seq: i },
    }));

    const { error: spanErr } = await supabase.from("trace_spans").insert(spans);
    if (spanErr) console.warn("⚠️  trace_spans:", spanErr.message);
    else console.log(`  ✓ trace + ${spanCount} spans: ${status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main tick loop
// ─────────────────────────────────────────────────────────────────────────────
async function tick() {
    tickCount++;
    console.log(`\n🔄 [tick #${tickCount}] ${new Date().toISOString()}`);

    // Reload references every 50 ticks so we pick up newly inserted rows
    if (tickCount % 50 === 1) {
        await loadReferences();
    }

    await Promise.allSettled([
        insertPerformanceMetrics(),
        insertMetricsStream(),
        insertSessionEvents(),
        insertLogs(),
        updateNfInstances(),
        maybeRaiseOrClearAlarm(),
        maybeInsertAnomalyAlert(),
        updateAiPredictions(),
        updateChargingSessions(),
        maybeInsertThreatAlert(),
        maybeUpdateOptimizationRecommendation(),
        insertOrchestrationJob(),
        insertTraceAndSpan(),
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n🚀 NGCMCP Live Data Simulator`);
    console.log(`   Supabase: ${SUPABASE_URL}`);
    console.log(`   Tenant:   ${TENANT_ID}`);
    console.log(`   Interval: ${TICK_INTERVAL_MS}ms\n`);

    await loadReferences();

    if (!nfs.length) {
        console.error(
            "❌ No network functions found for tenant.\n" +
            "   Make sure you have run the migrations and seed:\n" +
            "     npm run db:migrate\n"
        );
        process.exit(1);
    }

    // Run first tick immediately
    await tick();

    // Then schedule recurring ticks
    const interval = setInterval(async () => {
        try {
            await tick();
        } catch (err) {
            console.error("❌ Tick error:", err);
        }
    }, TICK_INTERVAL_MS);

    // Graceful shutdown
    const shutdown = () => {
        clearInterval(interval);
        console.log("\n✅ Live data simulator stopped.");
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

main().catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});
