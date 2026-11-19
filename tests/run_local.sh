#!/usr/bin/env bash
# Prueba migraciones + seed + RLS en un Postgres 16 local (sin Supabase).
# supabase_shim.sql imita roles, auth.uid()/auth.role() y storage.
# Uso: PGHOST=/var/run/postgresql PGUSER=postgres bash tests/run_local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${DB:-caballos_test}
psql -q -c "drop database if exists $DB" -c "create database $DB"
p() { psql -v ON_ERROR_STOP=1 -q -d "$DB" "$@"; }
p -f tests/supabase_shim.sql
for f in supabase/migrations/*.sql; do echo "== $f"; p -f "$f"; done
echo "== seed"; p -f supabase/seed.sql > /dev/null
echo "== checks (los ERROR esperados prueban que RLS bloquea)"
psql -d "$DB" -f tests/checks.sql
