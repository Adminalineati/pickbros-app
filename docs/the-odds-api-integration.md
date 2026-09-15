# The Odds API — integración en PickBros

Proveedor **exclusivo de cuotas**. Highlightly sigue siendo el proveedor de
deportes, ligas, equipos, fixtures, scores, standings, logos y highlights.

Documentación oficial consultada:

- https://the-odds-api.com/liveapi/guides/v4/
- https://the-odds-api.com/sports-odds-data/betting-markets.html
- https://the-odds-api.com/sports-odds-data/sports-apis.html

## Arquitectura

```
Highlightly                         The Odds API
(sports.json / futuro Nest)         (api.the-odds-api.com/v4)
        |                                    |
        v                                    v
 Sports Data Layer                  BettingOddsProvider
        |                           OddsCacheService
        |                                    |
        +-------- matchSportsEvents() -------+
                         |
                         v
              EventoCuotas (contrato interno)
                         |
              GET /api/v1/cuotas/*
                         |
                       React
              (nunca ve la API cruda ni la llave)
```

Capas en código:

| Capa | Path |
| --- | --- |
| Cliente HTTP | `apps/api/src/integrations/the-odds-api/` |
| Cache / matching / consensus | `apps/api/src/modules/odds/` |
| Contrato | `packages/types` (`EventoCuotas`, …) |
| UI | `apps/web/src/components/odds-*`, `use-sports-odds.ts` |

Highlightly permanece en `apps/web/scripts/highlightly.mjs`. No se mezcla.

## Autenticación

The Odds API v4 autentica con `apiKey` en query string:

```http
GET https://api.the-odds-api.com/v4/sports?apiKey=...
GET https://api.the-odds-api.com/v4/sports/{sport_key}/odds?apiKey=...&regions=us&markets=h2h,spreads,totals&oddsFormat=american
```

La llave vive **solo** en el backend:

```text
THE_ODDS_API_KEY=
```

- Local: `apps/api/.env`
- GitHub: Secret del environment (cuando el API se despliegue)
- AWS: Secrets Manager, mismo patrón que el password de RDS

Nunca `NEXT_PUBLIC_*`, nunca el frontend, nunca logs.

## sport_key reales (v4)

No existe un `soccer` genérico. Soccer se parte por liga.

| Liga PickBros | `sport_key` |
| --- | --- |
| NFL | `americanfootball_nfl` |
| NBA | `basketball_nba` |
| MLB | `baseball_mlb` |
| Champions | `soccer_uefa_champs_league` |

Aliases de ruta aceptados: `nfl`, `nba`, `mlb`, `champions`, `soccer`, `ucl`.

`GET /v4/sports` no consume cuota. Úsalo para validar keys si el catálogo cambia.

## Mercados iniciales

| Mercado PickBros | `markets` | `oddsFormat` |
| --- | --- | --- |
| Moneyline | `h2h` | `american` |
| Spreads | `spreads` | `american` |
| Totales | `totals` | `american` |

La app **no** convierte decimal → americano. Pedimos americano directo.

Soccer `h2h` puede incluir `Draw`. Se guarda en `markets.moneyline.draw`.

## Endpoints internos

Prefijo: `/api/v1`. Todos `@Public()`.

### GET /api/v1/cuotas/:liga

Equivalente a `GET /api/odds/nfl`.

```http
GET /api/v1/cuotas/nfl?markets=h2h,spreads,totals
```

Respuesta: lista normalizada de la liga (IDs de The Odds API + `matched: false`
hasta asociar con Highlightly).

### GET /api/v1/eventos/:eventId/cuotas

`eventId` es el ID Highlightly (`highlightly:nfl:…`).

Query obligatoria para matching (Nest no tiene el snapshot Highlightly):

```http
GET /api/v1/eventos/highlightly:nfl:123/cuotas?liga=NFL&local=Kansas%20City%20Chiefs&visitante=Buffalo%20Bills&iniciaEn=2026-09-13T00:20:00.000Z
```

Usa el cache de `/odds` de la liga. **No** llama al endpoint caro de props.

### POST /api/v1/cuotas/asociar

Para el calendario: un request con los eventos Highlightly visibles.
Agrupa por liga, reutiliza cache, devuelve el mapa `eventId → EventoCuotas`.

## Matching Highlightly ↔ The Odds API

`matchSportsEvents()` compara:

- liga / sport
- nombres de local y visitante (normalizados + aliases + apodo como último token)
- `iniciaEn` vs `commence_time` (ventana por defecto 18 h)

Si no hay match confiable: warning en log, `available: false`, sin inventar.

## Consensus y posición de mercado

No se promedian American odds.

1. `americanOddsToProbability`
   - negativo: `abs(odds) / (abs(odds) + 100)` → `-250` = 71.43%
   - positivo: `100 / (odds + 100)` → `+210` = 32.26%
2. Promedio de probabilidades entre books (misma línea en spreads/totals).
3. `probabilityToAmericanOdds` de vuelta.

`favorite` / `underdog` / `even` salen de esas cuotas. **No es predicción.**

## Cache y costos

No hay Redis. `OddsCacheService` es memoria + deduplicación in-flight.

| Situación | TTL env | Default |
| --- | --- | --- |
| Prematch | `ODDS_PREMATCH_CACHE_TTL` | 60 s |
| Live (`commence_time` ≤ now) | `ODDS_LIVE_CACHE_TTL` | 40 s |
| Props (futuro) | `ODDS_PROPS_CACHE_TTL` | 60 s |

Costo oficial: `markets × regions`.
`h2h,spreads,totals` + `us` = **3 créditos por liga** por miss de cache.

Headers que se loguean (nunca la llave):

- `x-requests-remaining`
- `x-requests-used`
- `x-requests-last`

```text
[ODDS_API] sport=nfl markets=h2h,spreads,totals events_received=14 highlightly_matches=13 unmatched=1 cache_hit=true duration=84 remaining=410 used=90 last_cost=3
```

No hay workflow de sync de cuotas: un cron horario quemaría ~12 créditos/hora.

## Player props (preparado, no implementado)

The Odds API solo los sirve **por evento**:

`GET /v4/sports/{sport}/events/{eventId}/odds?markets=player_pass_yds,...`

Keys previstas (oficiales):

| Liga | Markets |
| --- | --- |
| NFL | `player_pass_yds`, `player_rush_yds`, `player_reception_yds`, `player_pass_tds`, `player_pass_interceptions` |
| NBA | `player_points`, `player_assists`, `player_rebounds`, `player_threes`, `player_points_rebounds_assists` |
| MLB | `pitcher_strikeouts`, `batter_hits`, `batter_home_runs` |

No se descargan en el listado. Alternates (`alternate_spreads`, `alternate_totals`)
tampoco en esta fase.

## Errores

| The Odds API | Comportamiento PickBros |
| --- | --- |
| 401 / 403 | Log + `available: false` |
| 404 | Liga/evento sin odds |
| 422 | Parámetros inválidos |
| 429 | Log + unavailable |
| 5xx / timeout | Log + unavailable |

Highlightly y `/deportes` no se caen. UI: **“Cuotas no disponibles”**.

## Variables de entorno

```text
THE_ODDS_API_KEY=
THE_ODDS_API_REGION=us
THE_ODDS_API_MARKETS=h2h,spreads,totals
THE_ODDS_API_BOOKMAKERS=
ODDS_PREMATCH_CACHE_TTL=60
ODDS_LIVE_CACHE_TTL=40
ODDS_PROPS_CACHE_TTL=60
```

Frontend: solo `NEXT_PUBLIC_API_URL` (ya existía).

## Infra / CI

- IaC = Terraform (`pickbros-infra/modules/app-secrets`).
- El contenedor del secret cuesta ~USD 0.40/mes. **ECS sigue apagado** (`enable_api=false`) hasta que decidas pagar Fargate.
- La key vive en GitHub Secret `THE_ODDS_API_KEY` (environment `dev`).
- GitHub Actions copia la key a AWS Secrets Manager; Terraform no guarda el valor real.

### Workflows (pickbros-app)

1. **Probar The Odds API** (`test-odds-api.yml`) — manual, gratis, valida la key desde runners de GitHub (útil si tu red bloquea OpenDNS).
2. **Sincronizar secret The Odds API** (`sync-odds-secret.yml`) — manual, escribe en `pickbros-dev/the-odds-api-key`.
3. **Publicar en AWS** — si despliegas API (`api_action=deploy`), sincroniza el secret antes de ECS.

### Orden costo mínimo

```text
terraform apply (pickbros-infra dev)  → crea secret vacío en AWS
GitHub: Probar The Odds API          → confirma la key
GitHub: Sincronizar secret           → copia key a AWS
(más adelante) enable_api + deploy   → cuotas en CloudFront /api/*
```

Cuando ECS esté activo, la task lee `THE_ODDS_API_KEY` desde Secrets Manager y el resto de variables desde env (region, markets, TTL).

## Cómo probar localmente

```bash
cd pickbros-app
cp apps/api/.env.example apps/api/.env
# pega THE_ODDS_API_KEY en apps/api/.env
pnpm dev
```

- Web: http://localhost:3000/deportes
- API: http://localhost:3001/api/v1/cuotas/nfl
- Health: http://localhost:3001/api/v1/health

```bash
pnpm --filter api test
pnpm --filter web test
```

En CloudFront, si el API no está desplegado, el calendario Highlightly sigue
y las cuotas muestran el estado vacío.

## Copy de producto

Usar:

- “Probabilidad implícita del mercado”
- “Favorito” / “Underdog” / “Even” como **posición de mercado**

No usar:

- “Chance to win”
- “Prediction”
- “AI Prediction”
