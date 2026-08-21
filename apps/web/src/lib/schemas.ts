import { z } from 'zod';

const equipoSchema = z.object({
  nombre: z.string(),
  iniciales: z.string(),
  acento: z.string(),
});

export const dashboardSchema = z.object({
  usuario: z.object({
    nombre: z.string(),
    saludo: z.string(),
  }),
  rango: z.object({
    nombre: z.string(),
    nivel: z.number(),
  }),
  pickCoins: z.number(),
  pickets: z.number(),
  rachaDias: z.number(),
  challengeDelDia: z.object({
    titulo: z.string(),
    pregunta: z.string(),
    local: equipoSchema,
    visitante: equipoSchema,
    horario: z.string(),
    premioPickCoins: z.number(),
  }),
  eventosDestacados: z.array(
    z.object({
      id: z.string(),
      liga: z.enum(['MLB', 'NBA', 'NFL', 'Champions']),
      local: z.string(),
      visitante: z.string(),
      inicialesLocal: z.string(),
      inicialesVisitante: z.string(),
      horario: z.string(),
    }),
  ),
  rankingSemanal: z.array(
    z.object({
      puesto: z.number(),
      alias: z.string(),
      puntos: z.number(),
      esUsuarioActual: z.boolean().optional(),
    }),
  ),
  misiones: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      descripcion: z.string(),
      progreso: z.number(),
      meta: z.number(),
    }),
  ),
});

export const tiendaSchema = z.object({
  usuario: z.object({
    nombre: z.string(),
    saludo: z.string(),
  }),
  rango: z.object({
    nombre: z.string(),
    nivel: z.number(),
  }),
  pickCoins: z.number(),
  pickets: z.number(),
  rachaDias: z.number(),
  productoDestacado: z.object({
    id: z.string(),
    nombre: z.string(),
    descripcion: z.string(),
    categoria: z.enum(['fan-shop', 'recompensas', 'premios-exclusivos', 'merch']),
    precioPickCoins: z.number().optional(),
    precioPickets: z.number().optional(),
    destacado: z.boolean().optional(),
    etiqueta: z.string().optional(),
  }),
  productos: z.array(
    z.object({
      id: z.string(),
      nombre: z.string(),
      descripcion: z.string(),
      categoria: z.enum(['fan-shop', 'recompensas', 'premios-exclusivos', 'merch']),
      precioPickCoins: z.number().optional(),
      precioPickets: z.number().optional(),
      destacado: z.boolean().optional(),
      etiqueta: z.string().optional(),
    }),
  ),
});
