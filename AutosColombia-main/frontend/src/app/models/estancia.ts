import { Celda } from './celda';
import { Vehiculo } from './vehiculo';
import { Operador } from "./operador";

export interface EntradaCrear {
  placa: string;
  celda_id: number;
  operador_id: number;
}
export interface SalidaCrear {
  placa: string;
  operador_id: number;
}
export interface Estancia {
  id: number;
  vehiculo_id: number;
  celda_id: number;
  entrada: string;
  salida: string | null;
  operador_entrada_id: number;
  operador_salida_id: number | null;
}
export interface EstadoVehiculo {
  vehiculo: Vehiculo;
  esta_dentro: boolean;
  estancia: (Estancia & { celda: Celda }) | null;
}
export interface EstanciaHistorial extends Estancia {
  vehiculo: Vehiculo;
  celda: Celda;
  operador_entrada: Operador;
  operador_salida: Operador | null;
}
export interface EstanciasPagina {
  items: EstanciaHistorial[];
  total: number;
  offset: number;
  limit: number;
}
