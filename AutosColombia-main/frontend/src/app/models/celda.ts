export type TipoCelda = "Moto" | "Automóvil" | "Camioneta";

export interface Celda {
  id: number;
  codigo: string;
  tipo: TipoCelda;
}
export interface CeldaCrear {
  codigo: string;
  tipo: TipoCelda;
}

export interface CeldaActualizar {
  codigo?: string;
  tipo?: TipoCelda;
}
export interface Celda extends CeldaCrear {
  id: number;
}
export interface CeldasPagina {
  items: Celda[];
  total: number;
  offset: number;
  limit: number;
}
