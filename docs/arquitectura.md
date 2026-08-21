# Arquitectura (versión corta)

PickBros es **una sola web** que se adapta a celular, tablet y computadora.

Hay dos piezas hoy:

1. **Web** (`apps/web`) — lo que ve la persona. Se exporta a estáticos para CloudFront.
2. **API** (`apps/api`) — NestJS. Sin `DATABASE_URL` responde mocks; con Postgres usa Prisma.

El detalle de tablas está en `docs/datos.md`.
