#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env.local ]; then
  echo ".env.local not found"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env.local
set +a

node ./scripts/db-probe.mjs
