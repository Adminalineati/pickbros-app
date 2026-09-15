# Estado actual — integración de cuotas (The Odds API)

Auditoría del repositorio **antes** de agregar The Odds API.
Fecha: 12 de septiembre de 2026.
Highlightly **no se reemplaza**: sigue siendo el proveedor de datos deportivos.

## 1. Arquitectura actual

PickBros es un monorepo (`pickbros-app` + `pickbros-infra`) con dos runtimes de producto y una receta Terraform.

```
                    GitHub Actions (hora)
                    HIGHLIGHTLY_API_KEY
                              |
                              v
                     highlightly.mjs
                     (normaliza eventos)
                              |
                              v
                 S3 /data/sports.json
                              |
                              v
                      CloudFront (web estática)
                              |
                              v
                           React
                    useSportsCalendar()
```

| Pieza | Tecnología | Estado real |
| --- | --- | --- |
| Frontend | Next.js 15, React 19, Tailwind 4, export estático | Publicado en CloudFront |
| Backend | NestJS 11, prefijo `/api/v1` | Existe en repo; **ECS/Fargate apagado** (`enable_api = false`) |
| Auth publicada | Cognito (SRP, cookies/JWT en web) | Activa en CloudFront |
| Auth local | Nest + JWT HttpOnly + Postgres | Solo `pnpm dev` |
| Datos deportivos en prod | Snapshot `data/sports.json` | Highlightly vía Actions |
| Datos deportivos en API | Prisma `sport_events` | Esquema listo, **sin sync Highlightly en Nest** |

No hay stores/Redux. El calendario vive en un hook cliente que lee JSON estático.

## 2. Frameworks

### Frontend

- Next.js 15 (`output: 'export'`, `trailingSlash: true`)
- React 19
- Tailwind CSS 4 + tokens `@pickbros/ui`
- Zod, react-hook-form, amazon-cognito-identity-js
- Pruebas: `node:test` / `tsx --test`

### Backend

- NestJS 11 + Express
- Prisma 6 + PostgreSQL 16
- class-validator / class-transformer
- Pruebas: Jest + ts-jest
- Node 20, pnpm 10.15 workspaces

## 3. Estructura de carpetas

```
pickbros/
  pickbros-app/
    apps/web/                 Next export + scripts Highlightly
    apps/api/                 Nest + Prisma
    packages/types            Contratos compartidos
    packages/ui               Tokens / cn
    packages/config           tsconfig base
    docs/                     Arquitectura, datos, proveedores
    .github/workflows/        quality, AWS, sync-sports, preview
  pickbros-infra/
    bootstrap/                Estado remoto Terraform
    environments/dev|qa|prod
    modules/                  network, storage, frontend, database,
                              compute, cognito, waf, ecr, dns, oidc
```

No existe hoy `src/integrations/`. Highlightly vive en
`apps/web/scripts/highlightly.mjs`. Nest tiene solo la interfaz
`ProveedorDeportivo` en `apps/api/src/modules/sports/sports-provider.ts`.

## 4. Servicios deportivos existentes

| Capa | Archivo | Rol |
| --- | --- | --- |
| Cliente Highlightly + normalización | `apps/web/scripts/highlightly.mjs` | Única integración viva |
| Job de sync | `apps/web/scripts/sync-sports.mjs` | Escribe `sports.json` |
| Contrato frontend | `packages/types` → `EventoDeportivo`, `CalendarioDeportivo` | IDs `highlightly:{liga}:{id}` |
| Hook | `apps/web/src/lib/use-sports-calendar.ts` | Fetch `/data/sports.json` cada 2 min |
| Helpers UI | `apps/web/src/lib/sports-data.ts` | Demo fallback, challenge, destacados |
| Pantalla | `apps/web/src/components/sports-center.tsx` | Calendario / resultados |
| Cards dashboard | `featured-events.tsx`, `event-card.tsx`, `daily-challenge.tsx` | Leen el mismo snapshot |
| Nest sports | `SportsService` / `SportsController` | Lee Prisma; no Highlightly |
| Interfaz futura | `ProveedorDeportivo` | Pensada para Highlightly en Nest, **no implementada** |

Highlightly **no** está en Nest. El API no conoce el snapshot `sports.json`.

## 5. Archivos que consumen Highlightly

- `pickbros-app/apps/web/scripts/highlightly.mjs`
- `pickbros-app/apps/web/scripts/highlightly.test.mjs`
- `pickbros-app/apps/web/scripts/sync-sports.mjs`
- `pickbros-app/apps/web/src/lib/sports-data.ts` (consume el JSON ya normalizado)
- `pickbros-app/apps/web/src/lib/use-sports-calendar.ts`
- `pickbros-app/apps/web/src/components/sports-center.tsx`
- `pickbros-app/apps/web/next.config.ts` (hostnames de logos)
- `pickbros-app/.github/workflows/sync-sports.yml`
- `pickbros-app/docs/proveedores-deportivos.md`
- `pickbros-app/packages/types/src/index.ts` (`proveedor: 'highlightly'`)

La web **nunca** llama a `sports.highlightly.net` ni recibe la llave.

## 6. Variables de entorno Highlightly

| Variable | Dónde | Notas |
| --- | --- | --- |
| `HIGHLIGHTLY_API_KEY` | GitHub Secret environment `dev`; `apps/web/.env.example` | Solo el job de sync |
| `SPORTS_TIMEZONE` | Actions + `.env.example` | Default `America/Mexico_City` |
| `FRONTEND_BUCKET` | GitHub Var | Destino S3 del JSON |
| `CLOUDFRONT_DISTRIBUTION_ID` | GitHub Var | Invalidación `/data/sports.json` |
| `AWS_APPLICATION_DEPLOY_ROLE_ARN` | GitHub Secret / rol OIDC | Deploy y sync |

No hay `NEXT_PUBLIC_*` con la llave. Nest `.env.example` **no** tiene Highlightly.

## 7. Endpoints backend existentes

Prefijo global: `/api/v1`.

| Método | Ruta | Auth |
| --- | --- | --- |
| GET | `/health`, `/health/ready` | `@Public()` |
| POST/GET | `/auth/*` (registro, login, verificación, reset) | `@Public()` |
| GET | `/dashboard` | Guard global si `AUTH_REQUIRED=true` |
| GET | `/store` | igual |
| GET | `/deportes/eventos?league=` | igual; Prisma |
| GET | `/deportes/competiciones/:id/clasificacion` | igual; Prisma |

No existen rutas de cuotas. En local `AUTH_REQUIRED=false`. En ECS (cuando se encienda) será `true`. Las cuotas de calendario deben ser `@Public()` para no romper `/deportes`.

## 8. Hooks / services / contexts del frontend

No hay Context de deportes ni store global.

| Pieza | Fuente |
| --- | --- |
| `useSportsCalendar` | `/data/sports.json` |
| `cargarCalendarioDeportivo` | mismo JSON |
| `eventosDestacados` / `challengeDesdeCalendario` | derivan del snapshot |
| Dashboard / Store | mocks o Cognito; no Nest en CloudFront |

`NEXT_PUBLIC_API_URL` existe (`http://localhost:3001/api/v1`) pero la pantalla de deportes **no** la usa.

## 9. Modelos / types

### Frontend (`@pickbros/types`)

- `LigaDeportiva`: `MLB | NBA | NFL | Champions`
- `EventoDeportivo.id`: `highlightly:{liga}:{id}`
- Equipos: `id`, `nombre`, `codigo`, `logoUrl?`
- Fechas: `iniciaEn` ISO-8601 UTC
- Estados: `PROGRAMADO | EN_VIVO | FINALIZADO | POSPUESTO | CANCELADO`
- Calendario: `zonaHoraria`, `ventana.desde/hasta` `YYYY-MM-DD`

### Prisma

- `League`: `MLB NBA NFL CHAMPIONS`
- `SportEvent`: `providerId + externalId` único, `startsAt`, `rawPayload` JSONB
- `SportsDataProvider`, `Team`, `Competition`, `Standing`, `SportsSyncRun`
- No hay tablas de odds / bookmakers

No confundir `EventoDeportivo.id` (Highlightly) con el `cuid()` de Prisma.

## 10. Redis / cache

**No hay Redis**, ElastiCache ni capa de cache de aplicación.
El “cache” de deportes es S3 + CloudFront (`max-age=300`) + revalidación del hook (2 min).

Para cuotas se introduce `OddsCacheService` en memoria (abstracción, no Redis).

## 11. Base de datos

- **PostgreSQL 16** local (Docker Compose) y RDS en Terraform (`enable_database`, default true en dev).
- **No DynamoDB**.
- Password RDS en **Secrets Manager**.
- Prisma es el único acceso SQL.

## 12. Servicios AWS / IaC

| Tecnología | ¿Existe? | Notas |
| --- | --- | --- |
| CloudFront | Sí | Web + (opcional) `/api/*` → ALB |
| S3 | Sí | Export estático + `sports.json` |
| Cognito | Sí | Auth publicada |
| WAF | Sí (flag) | Frente a CloudFront |
| ECR | Sí | Imagen API |
| ECS + Fargate | Declarado | `enable_api = false` |
| ALB | Declarado | Solo si API on |
| RDS Postgres | Declarado | Dev |
| Secrets Manager | Sí | Solo secret maestro de RDS |
| GitHub OIDC | Sí | Deploy sin access keys |
| API Gateway | No | |
| Lambda | No | |
| WebSockets | No | |
| EventBridge | No | Sync es cron de GitHub Actions |
| Terraform | **Sí** | Única IaC |
| CDK / Serverless / SAM | No | |

No inventar otra IaC. Cuando ECS se encienda, `THE_ODDS_API_KEY` debe ir a Secrets Manager como el password de RDS, no a variables de Terraform en claro.

## 13. CI/CD

| Workflow | Repo | Qué hace |
| --- | --- | --- |
| `deploy-aws.yml` | app | lint+test; web → S3+CF en push a `main`; API solo `workflow_dispatch` |
| `sync-sports.yml` | app | cron horario Highlightly → S3 |
| `preview.yml` | app | GitHub Pages |
| `terraform-plan.yml` / `terraform-apply.yml` | infra | Plan/apply manual |

Secrets relevantes: `HIGHLIGHTLY_API_KEY`, `AWS_APPLICATION_DEPLOY_ROLE_ARN`.
Environments GitHub: `dev` (y qa/prod en dispatch).
`THE_ODDS_API_KEY` **no** debe hardcodearse en workflows.

## 14. IDs, fechas y timezone

| Concepto | Convención actual |
| --- | --- |
| Evento UI | `highlightly:nfl:12345` |
| Equipo UI | `String(team.id ?? nombre)` de Highlightly |
| Liga | `MLB`, `NBA`, `NFL`, `Champions` |
| Instante | ISO UTC (`toISOString()`) |
| Día de ventana | `YYYY-MM-DD` en `America/Mexico_City` |
| UI | `Intl` `es-MX` + `data.zonaHoraria` |

The Odds API usa **otros** IDs (`id` hex), `sport_key` (`americanfootball_nfl`) y `commence_time` UTC.
**Nunca** asumir `HighlightlyEventId === OddsEventId`.

Highlightly pide `timezone=America/Mexico_City` al proveedor; el normalizador guarda UTC.
Hay riesgo de desfase de horas al cruzar con `commence_time`. El matcher usa ventana, no igualdad exacta.

## 15. Flujo Highlightly (detalle)

1. Actions asume rol OIDC `pickbros-nonprod-application-deploy`.
2. Baja el `sports.json` anterior de S3.
3. `sincronizarDeportes()` llama RapidAPI Highlightly (`x-rapidapi-key`) por liga/fecha.
4. Normaliza a `EventoDeportivo` y recorta la ventana (2 días atrás + hoy + 14 adelante).
5. Modo rápido: solo hoy (4 requests). Completo: más fechas.
6. Publica JSON y invalida CloudFront.
7. React lee el JSON. Si viene vacío, `calendarioConAgenda` inyecta 4 partidos demo.

Cuota Highlightly: ~100 req/día. El diseño de sync **no** se toca.

## 16. Pantallas deportivas (UI)

- `/deportes` — `SportsCenter`: filtros liga/estado, filas local–marcador–visitante, logos Highlightly.
- Dashboard — `FeaturedEvents` + `DailyChallenge` sobre el mismo snapshot.
- **No hay** ruta de detalle `/deportes/[id]`.
- No hay cuotas, bookmakers ni probabilidad implícita.

Integración UI: **añadir cuotas a `EventRow`** (y opcionalmente a la card destacada), sin rediseñar el centro deportivo.

## 17. Duplicaciones y huecos

- Contrato deportivo duplicado: `EventoDeportivo` (JSON) vs Prisma `SportEvent`.
- `ProveedorDeportivo` en Nest no tiene implementación Highlightly.
- Demo local vs snapshot CloudFront (nombres cortos tipo “Chiefs” vs nombres largos).
- Sports Nest no es `@Public()`; hoy no lo usa la web.
- No hay capa `integrations/`.

## 18. Dónde integrar The Odds API

```
Highlightly  →  Sports Data Layer (sports.json / futuro Nest)
The Odds API →  Betting Data Layer (Nest, llave solo server)
        \            /
         Normalization + matchSportsEvents()
                    |
              GET /api/v1/cuotas/*
                    |
            OddsCacheService (memoria)
                    |
                  React
```

Puntos concretos:

1. **Nuevo** `apps/api/src/integrations/the-odds-api/` — HTTP client, nunca Highlightly.
2. **Nuevo** `apps/api/src/modules/odds/` — cache, matching, consensus, controllers.
3. **Extender** `@pickbros/types` con el contrato de cuotas.
4. **Nuevo hook** `useSportsOdds` que solo habla con Nest (`NEXT_PUBLIC_API_URL`).
5. **Extender** `sports-center.tsx` (y de forma ligera `event-card` si hay match).
6. **No** meter The Odds API en `highlightly.mjs` ni en Actions de deportes (quemaría créditos y mezclaría proveedores).
7. IaC: documentar secret; no encender ECS ni crear CDK.

Constraint de publicación: CloudFront **no** tiene origen API mientras `enable_api=false`. En AWS las cuotas se mostrarán “no disponibles” sin romper Highlightly. En `pnpm dev` sí, porque corre Nest en :3001.

## 19. Riesgos

| Riesgo | Por qué | Mitigación |
| --- | --- | --- |
| Matching de eventos | IDs distintos; “Chiefs” vs “Kansas City Chiefs”; soccer (United, CF) | Normalizar + aliases + ventana de tiempo; si no hay confianza, no inventar |
| Timezone | Highlightly fecha local; Odds UTC | Comparar instantes UTC con tolerancia (~12–18 h) |
| Créditos | `cost = markets × regions` (h2h+spreads+totals × us = 3 / liga) | Cache + dedupe; un GET /odds por liga; props solo en detalle (después) |
| Polling live | Odds en vivo cambian ~30–60 s | TTL 40 s live / 60 s prematch; **no** cron Actions |
| Rate limit 429 | Planes chicos | Backoff, devolver unavailable, Highlightly intacto |
| Juegos duplicados | Bookmakers listan el mismo game | Un evento Odds; consensus entre books |
| Soccer | No existe `sport_key=soccer`; UCL es `soccer_uefa_champs_league` | Mapear Champions → esa key |
| API apagada en AWS | `enable_api=false` | UI degrada a “Cuotas no disponibles” |
| Auth ECS | `AUTH_REQUIRED=true` rompería fetch anónimo | Endpoints de cuotas `@Public()` |
| Confusión producto | Mostrar -250 como “predicción” | Copy: “Probabilidad implícita del mercado” |

## 20. Decisiones propuestas

1. Highlightly permanece dueño de calendarios, scores, logos, standings.
2. The Odds API solo betting; `oddsFormat=american`; sin conversión decimal.
3. Separación `integrations/the-odds-api` vs scripts Highlightly.
4. Contrato interno en español alineado al repo (`EventoCuotas`, `PosicionMercado`).
5. Rutas Nest: `/api/v1/cuotas/:liga` y `/api/v1/eventos/:eventId/cuotas` (equivalentes a `/api/odds/...`).
6. Matching por deporte + nombres normalizados + `commence_time`; sin match → unavailable.
7. Consensus: promedio de implied probability, no promedio aritmético de American odds.
8. Favorite/underdog = posición de **mercado**, no predicción.
9. Cache en memoria (`OddsCacheService`); Redis cuando exista.
10. Player props: tipos listos, **sin** llamadas (caro; solo al abrir detalle en el futuro).
11. No sync de cuotas en GitHub Actions (un poll horario de 4 ligas × 3 markets ≈ 12 créditos/hora).
12. Terraform se documenta; no se añade otra herramienta ni se enciende ECS en este cambio.
13. Secretos: `.env` local + GitHub Secret / Secrets Manager cuando corra el API; nunca `NEXT_PUBLIC_`.

## 21. Plan de implementación (fases)

1. Auditoría y este documento.
2. Investigación The Odds API v4 (hecha; ver `the-odds-api-integration.md`).
3. Tipos normalizados + utilidades (odds, consensus, matching).
4. Client + cache + endpoints Nest.
5. UI en el calendario existente.
6. Tests unitarios.
7. Docs + `.env.example`.
8. lint / test.
