#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
COOKIE_JAR="/tmp/ngcmcp_smoke_cookie_$$.txt"
EMAIL="smoke+$(date +%s)@ngcmcp.local"
PASSWORD="SmokePass!$(date +%s)"
TENANT_NAME="Smoke Tenant $(date +%s)"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

json_assert_ok() {
  local file="$1"
  node -e '
const fs = require("fs");
const path = process.argv[1];
const body = JSON.parse(fs.readFileSync(path, "utf8"));
if (!body.ok) {
  console.error("API error:", JSON.stringify(body, null, 2));
  process.exit(1);
}
' "$file"
}

json_get() {
  local file="$1"
  local expr="$2"
  node -e '
const fs = require("fs");
const path = process.argv[1];
const expr = process.argv[2];
const body = JSON.parse(fs.readFileSync(path, "utf8"));
const value = expr.split(".").reduce((acc, part) => acc?.[part], body);
if (value === undefined || value === null) process.exit(1);
if (typeof value === "object") {
  console.log(JSON.stringify(value));
} else {
  console.log(String(value));
}
' "$file" "$expr"
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local out
  out="$(mktemp)"

  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$APP_URL$path" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      --data "$body" > "$out"
  else
    curl -sS -X "$method" "$APP_URL$path" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" > "$out"
  fi

  echo "$out"
}

echo "[1/10] Checking app reachability at $APP_URL"
curl -sS "$APP_URL" >/dev/null

echo "[2/10] Signup"
signup_body="$(cat <<JSON
{"email":"$EMAIL","password":"$PASSWORD","fullName":"Smoke Tester","tenantName":"$TENANT_NAME"}
JSON
)"
signup_res="$(request POST /api/auth/signup "$signup_body")"
json_assert_ok "$signup_res"
user_id="$(json_get "$signup_res" data.user_id)"
tenant_id="$(json_get "$signup_res" data.tenant_id)"

echo "[3/10] Session check"
session_res="$(request GET /api/auth/session)"
json_assert_ok "$session_res"

echo "[4/10] Dashboard health endpoint"
health_res="$(request GET /api/monitoring/health)"
json_assert_ok "$health_res"

echo "[5/10] Create subscriber"
subscriber_imsi="40445$(date +%s)"
subscriber_body="$(cat <<JSON
{"imsi":"$subscriber_imsi","msisdn":"91987$(date +%s)","plan":"smoke-plan","data_limit_gb":25,"roaming_enabled":true}
JSON
)"
subscriber_res="$(request POST /api/subscribers "$subscriber_body")"
json_assert_ok "$subscriber_res"
subscriber_id="$(json_get "$subscriber_res" data.id)"

echo "[6/10] List subscribers"
list_sub_res="$(request GET /api/subscribers?limit=5)"
json_assert_ok "$list_sub_res"

echo "[7/10] Create network function"
nf_body='{"name":"SMOKE-UPF-01","nf_type":"UPF","generation":"5G","version":"1.0.0","config":{"mode":"smoke"},"resource_limits":{"replicas":1,"cpu":"500m","memory":"1Gi"}}'
nf_res="$(request POST /api/network-functions "$nf_body")"
json_assert_ok "$nf_res"
nf_id="$(json_get "$nf_res" data.id)"

echo "[8/10] Create network slice"
slice_body='{"name":"SMOKE-IOT-SLICE","slice_type":"IoT","bandwidth_mbps":100,"latency_target_ms":20,"max_subscribers":1000}'
slice_res="$(request POST /api/slices "$slice_body")"
json_assert_ok "$slice_res"
slice_id="$(json_get "$slice_res" data.id)"

echo "[9/10] Assign slice to subscriber"
assign_body="$(cat <<JSON
{"slice_id":"$slice_id"}
JSON
)"
assign_res="$(request POST /api/subscribers/$subscriber_id/assign-slice "$assign_body")"
json_assert_ok "$assign_res"

echo "[10/10] Billing + logout"
billing_res="$(request GET /api/billing/summary)"
json_assert_ok "$billing_res"
logout_res="$(request POST /api/auth/logout)"
json_assert_ok "$logout_res"

cat <<SUMMARY

Smoke test passed.
- App URL: $APP_URL
- User ID: $user_id
- Tenant ID: $tenant_id
- Subscriber ID: $subscriber_id
- Network Function ID: $nf_id
- Slice ID: $slice_id
SUMMARY
