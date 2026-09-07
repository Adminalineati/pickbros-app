# Aplicación PickBros

La web y el API del producto. **Todo el texto de la interfaz está en español.**

## Demo local con registro e inicio de sesión

Necesitas Node 20+, pnpm y PostgreSQL 16. Con Docker:

```bash
cd pickbros-app
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter api prisma:migrate
pnpm dev
```

- Registro: http://localhost:3000/registro
- Inicio de sesión: http://localhost:3000/login
- Dashboard: http://localhost:3000
- API: http://localhost:3001/api/v1/health

El registro solicita nombre, apellido, correo, contraseña segura, fecha de
nacimiento, teléfono celular, país, estado y una de dos suscripciones (`subs1` o
`subs2`). La cuenta se activa con un código de verificación. Al iniciar sesión,
el Dashboard muestra el nombre y una insignia de color con la suscripción elegida.

La contraseña nunca se guarda directamente: el API almacena únicamente su hash.
El login usa una sesión JWT en cookie `HttpOnly` y bloquea la cuenta durante 15
minutos después de tres contraseñas incorrectas. También existe recuperación de
contraseña por código SMS. En AWS, Cognito enviará los mensajes reales.

Detalles técnicos y alcance: `docs/autenticacion.md`.

## Autenticación de la publicación AWS

La web publicada usa Amazon Cognito directamente, sin RDS ni API encendida:

- Cognito guarda los usuarios y valida el correo con un código.
- El inicio de sesión usa SRP y mantiene tokens JWT renovables durante 30 días.
- El Dashboard muestra el nombre y la suscripción `subs1` o `subs2`.
- La recuperación de contraseña se envía por correo. SMS permanece desactivado
  durante la fase de costo mínimo.

El build requiere `NEXT_PUBLIC_COGNITO_USER_POOL_ID`,
`NEXT_PUBLIC_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_LOCAL_AUTH_REQUIRED=true` y
`NEXT_PUBLIC_DEMO_MODE=false`.

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

Postgres local:

```bash
docker compose up -d
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
