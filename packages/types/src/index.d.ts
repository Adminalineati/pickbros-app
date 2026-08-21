export type LigaDeportiva = 'MLB' | 'NBA' | 'NFL' | 'Champions';
export interface UsuarioDashboard {
    nombre: string;
    saludo: string;
}
export interface RangoUsuario {
    nombre: string;
    nivel: number;
}
export interface EquipoChallenge {
    nombre: string;
    iniciales: string;
    acento: string;
}
export interface ChallengeDelDia {
    titulo: string;
    pregunta: string;
    local: EquipoChallenge;
    visitante: EquipoChallenge;
    horario: string;
    premioPickCoins: number;
}
export interface EventoDestacado {
    id: string;
    liga: LigaDeportiva;
    local: string;
    visitante: string;
    inicialesLocal: string;
    inicialesVisitante: string;
    horario: string;
}
export interface PosicionRanking {
    puesto: number;
    alias: string;
    puntos: number;
    esUsuarioActual?: boolean;
}
export interface MisionDiaria {
    id: string;
    titulo: string;
    descripcion: string;
    progreso: number;
    meta: number;
}
export interface DashboardRespuesta {
    usuario: UsuarioDashboard;
    rango: RangoUsuario;
    pickCoins: number;
    pickets: number;
    rachaDias: number;
    challengeDelDia: ChallengeDelDia;
    eventosDestacados: EventoDestacado[];
    rankingSemanal: PosicionRanking[];
    misiones: MisionDiaria[];
}
export type CategoriaTienda = 'fan-shop' | 'recompensas' | 'premios-exclusivos' | 'merch';
export interface ProductoTienda {
    id: string;
    nombre: string;
    descripcion: string;
    categoria: CategoriaTienda;
    precioPickCoins?: number;
    precioPickets?: number;
    destacado?: boolean;
    etiqueta?: string;
}
export interface TiendaRespuesta {
    usuario: UsuarioDashboard;
    rango: RangoUsuario;
    pickCoins: number;
    pickets: number;
    rachaDias: number;
    productoDestacado: ProductoTienda;
    productos: ProductoTienda[];
}
export interface SaludRespuesta {
    status: 'ok';
    service: 'pickbros-api';
}
