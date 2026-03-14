#!/usr/bin/env bash
# E2E test covering all blueprint API endpoint groups from Affirmed Networks / Microsoft NGCMCP
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
COOKIE_JAR="/tmp/ngcmcp_e2e_cookie_$$.txt"
EMAIL="e2e+$(date +%s)@ngcmcp.local"
PASSWORD="E2EPass!$(date +%s)"
TENANT_NAME="E2E Tenant $(date +%s)"

cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

json_assert_ok() {
  local file="$1"
  node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
if (!body.ok) {
  console.error("API error:", JSON.stringify(body, null, 2));
  process.exit(1);
}
' "$file"
}

json_get() {
  local file="$1" expr="$2"
  node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const value = process.argv[2].split(".").reduce((acc, part) => acc?.[part], body);
if (value === undefined || value === null) process.exit(1);
console.log(typeof value === "object" ? JSON.stringify(value) : String(value));
' "$file" "$expr"
}

req() {
  local method="$1" path="$2" body="${3:-}" out
  out="$(mktemp)"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$APP_URL$path" -H "Content-Type: application/json" -b "$COOKIE_JAR" -c "$COOKIE_JAR" --data "$body" > "$out"
  else
    curl -sS -X "$method" "$APP_URL$path" -b "$COOKIE_JAR" -c "$COOKIE_JAR" > "$out"
  fi
  echo "$out"
}

step=0
run() {
  step=$((step + 1))
  echo "[$step] $1"
}

run "App reachability"
curl -sS "$APP_URL" >/dev/null

run "Auth: Signup"
r="$(req POST /api/auth/signup "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"fullName\":\"E2E Tester\",\"tenantName\":\"$TENANT_NAME\"}")"
json_assert_ok "$r"
user_id="$(json_get "$r" data.user_id)"
tenant_id="$(json_get "$r" data.tenant_id)"

run "Auth: Session"
json_assert_ok "$(req GET /api/auth/session)"

run "API Root"
json_assert_ok "$(req GET /api)"

run "Monitoring: Health"
json_assert_ok "$(req GET /api/monitoring/health)"

run "Subscribers: Create"
imsi="40445$(date +%s)"
r="$(req POST /api/subscribers "{\"imsi\":\"$imsi\",\"msisdn\":\"91987$(date +%s)\",\"plan\":\"e2e-plan\",\"data_limit_gb\":25,\"roaming_enabled\":true}")"
json_assert_ok "$r"
subscriber_id="$(json_get "$r" data.id)"

run "Subscribers: List"
json_assert_ok "$(req GET /api/subscribers?limit=5)"

run "Network Functions: Create"
nf_body='{"name":"E2E-UPF-01","nf_type":"UPF","generation":"5G","version":"1.0.0","config":{"mode":"e2e"},"resource_limits":{"replicas":1,"cpu":"500m","memory":"1Gi"}}'
r="$(req POST /api/network-functions "$nf_body")"
json_assert_ok "$r"
nf_id="$(json_get "$r" data.id)"

run "Network Functions: List"
json_assert_ok "$(req GET /api/network-functions)"

run "Slices: Create"
r="$(req POST /api/slices '{"name":"E2E-IOT-SLICE","slice_type":"IoT","bandwidth_mbps":100,"latency_target_ms":20,"max_subscribers":1000}')"
json_assert_ok "$r"
slice_id="$(json_get "$r" data.id)"

run "Slices: List"
json_assert_ok "$(req GET /api/slices)"

run "Subscribers: Assign slice"
json_assert_ok "$(req POST /api/subscribers/$subscriber_id/assign-slice "{\"slice_id\":\"$slice_id\"}")"

run "Sessions: List"
json_assert_ok "$(req GET /api/sessions?limit=5)"

run "Sessions: Stats"
json_assert_ok "$(req GET /api/sessions/stats)"

run "Policies: List"
json_assert_ok "$(req GET /api/policies)"

run "Policies: Create"
r="$(req POST /api/policies '{"name":"E2E-Policy","rule_type":"qos","conditions":{"slice_type":"IoT"},"actions":{"qci":7},"priority":100}')"
json_assert_ok "$r"
policy_id="$(json_get "$r" data.id)"

run "Billing: Summary"
json_assert_ok "$(req GET /api/billing/summary)"

run "Billing: CDR"
json_assert_ok "$(req GET /api/billing/cdr?limit=5)"

run "Billing: Credits"
json_assert_ok "$(req GET /api/billing/credits)"

run "Monitoring: Metrics"
json_assert_ok "$(req GET /api/monitoring/metrics?limit=10)"

run "Monitoring: Alerts"
json_assert_ok "$(req GET /api/monitoring/alerts)"

run "Faults: Alarms"
json_assert_ok "$(req GET /api/faults/alarms)"

run "Orchestration: Jobs"
json_assert_ok "$(req GET /api/orchestration/jobs)"

run "Orchestration: Deploy"
r="$(req POST /api/orchestration/deploy '{"nf_type":"UPF","replicas":1}')"
json_assert_ok "$r"
job_id="$(json_get "$r" data.id 2>/dev/null || true)"

run "Security: Audit logs"
json_assert_ok "$(req GET /api/security/audit-logs?limit=5)"

run "Security: Policies"
json_assert_ok "$(req GET /api/security/policies)"

run "Marketplace: List"
json_assert_ok "$(req GET /api/marketplace)"

run "Compliance: Reports"
json_assert_ok "$(req GET /api/compliance/reports)"

run "Analytics: Overview"
json_assert_ok "$(req GET /api/analytics)"

run "Analytics: Usage"
json_assert_ok "$(req GET /api/analytics/usage)"

run "Analytics: Subscribers"
json_assert_ok "$(req GET /api/analytics/subscribers?limit=5)"

run "Deployments: List"
json_assert_ok "$(req GET /api/deployments)"

run "Deployments: Create"
r="$(req POST /api/deployments '{"nf_name":"E2E-DEPLOY-NF","nf_type":"AMF"}')"
json_assert_ok "$r"

run "Edge: Clusters list"
json_assert_ok "$(req GET /api/edge/clusters)"

run "Edge: Create cluster"
r="$(req POST /api/edge/clusters '{"name":"E2E-EDGE-01","node_count":2}')"
json_assert_ok "$r"
cluster_id="$(json_get "$r" data.id 2>/dev/null || true)"

if [[ -n "${cluster_id:-}" ]]; then
  run "Edge: Cluster nodes"
  json_assert_ok "$(req GET /api/edge/clusters/$cluster_id/nodes)"
  run "Edge: Add node"
  json_assert_ok "$(req POST /api/edge/clusters/$cluster_id/nodes '{"hostname":"edge-node-01","cpu_cores":4,"memory_gb":16}')"
fi

run "Edge: Nodes list"
json_assert_ok "$(req GET /api/edge/nodes)"

run "Configurations: List"
json_assert_ok "$(req GET /api/configurations)"

run "Configurations: Create"
r="$(req POST /api/configurations '{"name":"e2e-platform-config","scope":"platform","config":{"feature_flags":{"analytics":true}},"description":"E2E test config"}')"
json_assert_ok "$r"

run "Auth: Logout"
json_assert_ok "$(req POST /api/auth/logout)"

echo ""
echo "=== E2E test passed: $step steps ==="
echo "All blueprint API groups exercised: auth, subscribers, network-functions, slices, sessions, policies,"
echo "billing, monitoring, faults, orchestration, security, marketplace, compliance, analytics, configurations,"
echo "deployments, edge."
