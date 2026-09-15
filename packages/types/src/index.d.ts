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
    logoUrl?: string;
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
export type PosicionMercado = 'favorito' | 'underdog' | 'even';
export interface LineaSpread {
    line: number;
    odds: number;
}
export interface MercadoSpread {
    home?: LineaSpread;
    away?: LineaSpread;
}
export interface MercadoTotal {
    line: number;
    over?: number;
    under?: number;
}
export interface MercadoMoneyline {
    home?: number;
    away?: number;
    draw?: number;
}
export interface EquipoCuota {
    id?: string;
    nombre: string;
    moneyline?: number;
    impliedProbability?: number;
    marketPosition?: PosicionMercado;
}
export interface CuotaCasaApuesta {
    key: string;
    title: string;
    lastUpdated: string;
    moneyline?: MercadoMoneyline;
    spread?: MercadoSpread;
    total?: MercadoTotal;
}
export interface PosicionCuotaMercado {
    team: string;
    odds: number;
    impliedProbability: number;
}
export interface EventoCuotas {
    eventId: string;
    providerEventId?: string;
    sport: LigaDeportiva;
    matched: boolean;
    available: boolean;
    homeTeam: EquipoCuota;
    awayTeam: EquipoCuota;
    commenceTime: string;
    markets: {
        moneyline?: MercadoMoneyline;
        spread?: MercadoSpread;
        total?: MercadoTotal;
    };
    favorite?: PosicionCuotaMercado;
    underdog?: PosicionCuotaMercado;
    bookmakers?: CuotaCasaApuesta[];
    lastUpdated: string;
    source: 'the-odds-api';
}
export interface CuotasLigaRespuesta {
    liga: LigaDeportiva;
    sportKey: string;
    available: boolean;
    reason?: string;
    events: EventoCuotas[];
    unmatched: number;
    cacheHit: boolean;
    lastUpdated: string;
}
export interface EventoParaAsociarCuotas {
    id: string;
    liga: LigaDeportiva;
    localNombre: string;
    visitanteNombre: string;
    iniciaEn: string;
}
export interface CuotasAsociadasRespuesta {
    available: boolean;
    reason?: string;
    cacheHit: boolean;
    eventos: Record<string, EventoCuotas>;
    unmatched: string[];
    lastUpdated: string;
}
