# Modelo de datos

Postgres + Prisma. El API de Nest es el único que habla con la base. La web no arma queries: pide REST (`/api/v1/...`) y ya.

Hoy el dashboard y la tienda siguen en mocks. Cuando exista `DATABASE_URL`, Prisma se conecta y las pantallas se pueden ir pasando a tablas de a una.

## Cómo se consulta

- Lecturas y escrituras del producto: Prisma en los servicios de Nest.
- Ranking semanal: no se calcula en cada request. Un job (más adelante) escribe `weekly_rankings` y el dashboard lee ese snapshot.
- Wallet: `wallets` tiene el saldo; `wallet_ledger` guarda cada movimiento. Las dos cosas se tocan en la misma transacción, con `version` para no pisar un update.

No vamos a GraphQL ni a CQRS en esta etapa. Si un listado se pone pesado (historial de ledger, picks de un user), se pagina por `created_at` + id.

## Tablas

```
ranks 1──* users 1──1 wallets
                │
                ├──* wallet_ledger
                ├──* picks
                ├──* user_missions
                ├──* weekly_rankings
                └──* redemptions

sport_events 1──* daily_challenges 1──* picks
             └──* picks

missions 1──* user_missions
products 1──* redemptions
```

| Tabla | Para qué |
| --- | --- |
| `ranks` | Catálogo (Pick Master, etc.) |
| `users` | Cuenta, nivel, racha |
| `wallets` | Saldo PickCoins / Pickets |
| `wallet_ledger` | Historial; no se borra |
| `sport_events` | Duelos. Nombres en texto por ahora, sin logos de liga |
| `daily_challenges` | Un challenge por día |
| `picks` | Un pick por user+evento |
| `missions` / `user_missions` | Progreso diario |
| `weekly_rankings` | Top de la semana ya cerrado |
| `products` / `redemptions` | PickStore; el canje real viene después |

## Local

```bash
cd pickbros-app
docker compose up -d
# en apps/api/.env:
# DATABASE_URL=postgresql://pickbros:pickbros@localhost:5432/pickbros
pnpm --filter api prisma:migrate
```

En AWS el password vive en Secrets Manager (RDS lo crea). El API en un server leería ese secret; todavía no hay ECS.

## Índices que importan

- `picks (user_id, created_at)` y unique `(user_id, event_id)`
- `wallet_ledger (user_id, created_at)`
- `sport_events (starts_at)` y `(featured, starts_at)`
- `weekly_rankings (week_start, position)`
