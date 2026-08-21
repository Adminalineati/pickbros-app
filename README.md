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
