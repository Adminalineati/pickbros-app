#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-false}" = "true" ] && { [ -n "${DATABASE_URL:-}" ] || [ -n "${DB_HOST:-}" ]; }; then
  echo "Aplicando migraciones pendientes..."
  pnpm --filter api prisma:migrate
fi

exec "$@"
