const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Rutas de auth con slash final para el export estático en CloudFront. */
export function authHref(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  return `${basePath}${withSlash}`;
}
