export type EstadoAlerta = "PENDIENTE" | "ATENDIDA";

export type TipoVehiculoAlerta =
  | "MOTO"
  | "AUTOMOVIL"
  | "CAMIONETA";

export interface Alerta {
  id: number;
  vehiculo_id: number;
  placa: string;
  marca: string;
  modelo: number;
  color: string;
  tipo: TipoVehiculoAlerta;
  operador_id: number;
  operador: string;
  descripcion: string;
  fecha_hora: string;
  estado: EstadoAlerta;
  atendida_por_usuario_id: number | null;
  atendida_por_username: string | null;
  fecha_atencion: string | null;
}

export interface AlertaCrear {
  vehiculo_id: number;
  descripcion: string;
}

export interface VehiculoAlertaActualizar {
  marca?: string;
  modelo?: number;
  color?: string;
  tipo?: TipoVehiculoAlerta;
}

export interface AlertasPagina {
  items: Alerta[];
  total: number;
  offset: number;
  limit: number;
}

export interface AlertasFiltros {
  offset?: number;
  limit?: number;
  estado?: EstadoAlerta;
  fecha_desde?: string;
  fecha_hasta?: string;
  placa?: string;
  operador_id?: number;
}
