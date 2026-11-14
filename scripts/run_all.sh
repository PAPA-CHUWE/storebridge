#!/bin/sh
# Generates local secrets (if needed), picks free host ports, and builds/starts the whole stack.
set -eu

cd "$(dirname "$0")/.."

sh scripts/bootstrap.sh

# Drop any stack left running from a previous (possibly failed) run, so the port
# scan below checks reality rather than ports we ourselves left occupied.
docker compose down --remove-orphans >/dev/null 2>&1 || true

# Starting from each service's default port, bump by one until a free one is
# found, skipping ports already handed to another service in this same run.
# (Sets $found_port directly rather than via `$(...)`, since command
# substitution runs in a subshell and would lose claimed_ports updates.)
claimed_ports=""
find_free_port() {
  port=$1
  while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 \
      || case " $claimed_ports " in *" $port "*) true;; *) false;; esac; do
    port=$((port + 1))
  done
  claimed_ports="$claimed_ports $port"
  found_port=$port
}

find_free_port 8025; export MAILPIT_PORT=$found_port
find_free_port 8000; export SALEOR_API_PORT=$found_port
find_free_port 8001; export BACKEND_PORT=$found_port
find_free_port 3000; export FRONTEND_PORT=$found_port
find_free_port 9000; export SALEOR_DASHBOARD_PORT=$found_port

echo "Using ports: mailpit=$MAILPIT_PORT saleor-api=$SALEOR_API_PORT backend=$BACKEND_PORT frontend=$FRONTEND_PORT saleor-dashboard=$SALEOR_DASHBOARD_PORT"

docker compose up -d --build

echo "Stack is up. Frontend: http://localhost:$FRONTEND_PORT"
echo "Tail logs with: docker compose logs -f --tail=100"
