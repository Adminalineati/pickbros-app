#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ]; then
  DATABASE_URL="$(node -e "
    const required = ['DB_USERNAME', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME'];
    for (const key of required) {
      if (!process.env[key]) {
        console.error('Falta variable de entorno: ' + key);
        process.exit(1);
      }
    }
    const user = encodeURIComponent(process.env.DB_USERNAME);
    const pass = encodeURIComponent(process.env.DB_PASSWORD);
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const db = process.env.DB_NAME;
    process.stdout.write('postgresql://' + user + ':' + pass + '@' + host + ':' + port + '/' + db + '?sslmode=require');
  ")"
  export DATABASE_URL
fi

if [ "${RUN_MIGRATIONS:-false}" = "true" ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "Aplicando migraciones pendientes..."
  pnpm --filter api prisma:migrate
fi

exec "$@"
