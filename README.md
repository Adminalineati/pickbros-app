# Aplicación PickBros

La web y el API del producto. **Todo el texto de la interfaz está en español.**

## Cómo correrlo en local

Necesitas Node 20+ y pnpm.

```bash
cd pickbros-app
pnpm install
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/api/v1/health

## Preview para el equipo

La demo visual se publica en GitHub Pages al hacer push a `main`:

https://Adminalineati.github.io/pickbros-app/

Es el Dashboard y la PickStore con datos de ejemplo. No hace falta instalar nada.

La primera vez hay que activar Pages en el repo: **Settings → Pages → Source: GitHub Actions**.

Si el repo es privado y Pages no deja publicar, importar este mismo repo en [Vercel](https://vercel.com/new). Queda un link tipo `https://pickbros-app.vercel.app`.

Otros comandos:

```bash
pnpm lint
pnpm test
pnpm build
```

`pnpm build` en la web genera `apps/web/out/` (export estático para publicarlo después).

Postgres local (opcional):

```bash
docker compose up -d
# apps/api/.env → DATABASE_URL=postgresql://pickbros:pickbros@localhost:5432/pickbros
pnpm --filter api prisma:migrate
```

Tablas y criterio de queries: `docs/datos.md`.

## Qué hay dentro

- `apps/web` — Dashboard, PickStore y plantilla de navegación
- `apps/api` — salud, dashboard, tienda; Prisma listo, mocks si no hay DB
- `packages/types` — contratos compartidos
- `packages/ui` — tokens de color
- `packages/config` — TypeScript común

Los archivos `.env.local` / `.env` no se suben al repositorio. Copia los `.env.example`.
