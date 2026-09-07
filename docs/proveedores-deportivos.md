# Proveedores de datos deportivos

## Decisión aceptada

**Proveedor seleccionado: API-Sports.** Decisión aceptada el 4 de septiembre de 2026 después de comparar API-Sports, TheSportsDB, ESPN no oficial, BALLDONTLIE y football-data.org.

API-Sports será la fuente principal para desarrollo y beta privada. Cubre MLB, NBA, NFL y Champions League, ofrece eventos, resultados, datos en vivo y URLs de logos, y permite comenzar con un nivel gratuito.

API-Sports no incluye automáticamente derechos comerciales de publicación. Antes de mostrar estos datos en un producto público se debe validar la licencia por escrito.

Alternativas:

- Goalserve para un lanzamiento comercial con contrato de publicación;
- Sportradar para datos oficiales, push en tiempo real y operación enterprise;
- SportsDataIO como alternativa intermedia.

## Integración

El frontend nunca consulta directamente al proveedor ni recibe su llave.

Durante la publicación de costo mínimo, GitHub Actions consulta API-Sports cada
seis horas, normaliza los calendarios y publica únicamente
`data/sports.json` en el bucket privado servido por CloudFront. Son cuatro
consultas por ejecución (MLB, NBA, NFL y Champions), aproximadamente 16 al día.
La web muestra todos los horarios en `America/Mexico_City` y conserva el
snapshot anterior de una liga si esa fuente falla.

Cuando se active el API de NestJS y Postgres, el mismo contrato normalizado se
persistirá en las tablas deportivas y el frontend cambiará al endpoint interno.

Durante la demo con el nivel gratuito:

1. equipos, ligas y logos una vez al día;
2. próximos eventos cada seis horas;
3. resultados cuatro a seis veces al día y bajo actualización manual controlada.

Cuando exista un plan con cuota suficiente para producción:

1. eventos cercanos cada cinco minutos;
2. juegos en vivo cada 15–30 segundos;
3. clasificaciones cada hora y al finalizar partidos;
4. reconciliación de resultados una y 24 horas después.

Las tablas usan `(provider_id, external_id)` como clave única. El payload original se conserva temporalmente en JSONB para diagnosticar cambios del proveedor.

La interfaz `ProveedorDeportivo` permite reemplazar API-Sports por otro proveedor sin cambiar controladores ni tablas.

## Secretos

En la fase estática, la llave se configura como secreto del environment `dev`
del repositorio de GitHub:

```text
API_SPORTS_KEY
```

Nunca debe existir en variables `NEXT_PUBLIC_*`, archivos versionados ni en el
JSON publicado. Cuando ECS se habilite, la llave migrará a AWS Secrets Manager.

También deben existir las variables de GitHub `FRONTEND_BUCKET` y
`CLOUDFRONT_DISTRIBUTION_ID`, y el secreto
`AWS_APPLICATION_DEPLOY_ROLE_ARN`.
