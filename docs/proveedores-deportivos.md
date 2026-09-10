# Proveedores de datos deportivos

## Decisión aceptada

**Proveedor seleccionado: Highlightly All Sports API.** La migración se decidió
el 7 de septiembre de 2026 después de que el nivel gratuito de API-Sports
rechazara las temporadas actuales y limitara la cuenta a 2022–2024.

Highlightly cubre MLB, NBA, NFL y Champions League con una sola llave. El plan
Basic no requiere tarjeta, permite 100 solicitudes diarias e incluye
calendarios, resultados, estados en vivo y URLs de logos.

Sus términos permiten almacenar y mostrar los datos en aplicaciones. Los logos
y emblemas siguen siendo marcas de terceros: deben mostrarse sin modificaciones
y PickBros debe validar los permisos necesarios antes de un lanzamiento
comercial definitivo.

Alternativas:

- Goalserve para un lanzamiento comercial con contrato de publicación;
- Sportradar para datos oficiales, push en tiempo real y operación enterprise;
- SportsDataIO como alternativa intermedia.

## Integración

El frontend nunca consulta directamente al proveedor ni recibe su llave.

Durante la publicación de costo mínimo, GitHub Actions consulta Highlightly cada
hora en modo rápido, normaliza los calendarios y publica únicamente
`data/sports.json` en el bucket privado servido por CloudFront.

La ventana contiene dos días anteriores, el día actual y catorce días futuros.
Cada ejecución horaria actualiza solo el día actual para las cuatro ligas
(4 solicitudes por corrida, ~96 al día, dentro de las 100 incluidas). Los
eventos de otras fechas se conservan del snapshot anterior hasta una
sincronización completa manual (`workflow_dispatch` con `--completo`, 20
solicitudes). La web muestra los horarios en `America/Mexico_City` y conserva
los datos anteriores de una fecha si esa consulta falla.

Cuando se active el API de NestJS y Postgres, el mismo contrato normalizado se
persistirá en las tablas deportivas y el frontend cambiará al endpoint interno.

Durante la demo con el nivel gratuito:

1. equipos, ligas y logos una vez al día;
2. juegos del día cada hora;
3. ventana completa bajo sincronización manual controlada.

Cuando exista un plan con cuota suficiente para producción:

1. eventos cercanos cada cinco minutos;
2. juegos en vivo cada 15–30 segundos;
3. clasificaciones cada hora y al finalizar partidos;
4. reconciliación de resultados una y 24 horas después.

Las tablas usan `(provider_id, external_id)` como clave única. El payload original se conserva temporalmente en JSONB para diagnosticar cambios del proveedor.

La interfaz `ProveedorDeportivo` permite reemplazar Highlightly por otro
proveedor sin cambiar controladores ni tablas.

## Secretos

En la fase estática, la llave se configura como secreto del environment `dev`
del repositorio de GitHub:

```text
HIGHLIGHTLY_API_KEY
```

Nunca debe existir en variables `NEXT_PUBLIC_*`, archivos versionados ni en el
JSON publicado. Cuando ECS se habilite, la llave migrará a AWS Secrets Manager.

También deben existir las variables de GitHub `FRONTEND_BUCKET` y
`CLOUDFRONT_DISTRIBUTION_ID`, y el secreto
`AWS_APPLICATION_DEPLOY_ROLE_ARN`.
