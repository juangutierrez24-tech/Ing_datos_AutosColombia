import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { timeout } from "rxjs";

import { API_BASE_URL } from "./api.service";

import {
  Alerta,
  AlertaCrear,
  AlertasFiltros,
  AlertasPagina,
  VehiculoAlertaActualizar,
} from "../models/alerta";

@Injectable({
  providedIn: "root",
})
export class AlertasService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly endpoint = `${this.base}/alertas`;

  /**
   * Lista las alertas con filtros y paginación.
   * Requiere rol ADMINISTRADOR.
   */
  listar(filtros: AlertasFiltros = {}) {
    return this.http
      .get<AlertasPagina>(this.endpoint, {
        params: {
          offset: filtros.offset ?? 0,
          limit: filtros.limit ?? 20,
          ...(filtros.estado && { estado: filtros.estado }),
          ...(filtros.fecha_desde && {
            fecha_desde: filtros.fecha_desde,
          }),
          ...(filtros.fecha_hasta && {
            fecha_hasta: filtros.fecha_hasta,
          }),
          ...(filtros.placa && { placa: filtros.placa }),
          ...(filtros.operador_id !== undefined && {
            operador_id: filtros.operador_id,
          }),
        },
      })
      .pipe(timeout(15000));
  }

  /**
   * Consulta una alerta por su identificador.
   */
  obtener(id: number) {
    return this.http
      .get<Alerta>(`${this.endpoint}/${id}`)
      .pipe(timeout(15000));
  }

  /**
   * Registra una alerta reportada por un operador.
   * El operador se identifica mediante el JWT.
   */
  crear(data: AlertaCrear) {
    return this.http
      .post<Alerta>(this.endpoint, data)
      .pipe(timeout(15000));
  }

  /**
   * Actualiza los datos del vehículo asociado a una alerta.
   */
  actualizarVehiculo(
    id: number,
    data: VehiculoAlertaActualizar,
  ) {
    return this.http
      .patch<Alerta>(
        `${this.endpoint}/${id}/vehiculo`,
        data,
      )
      .pipe(timeout(15000));
  }

  /**
   * Marca una alerta como atendida.
   * El usuario administrador se identifica mediante el JWT.
   */
  atender(id: number) {
    return this.http
      .patch<Alerta>(
        `${this.endpoint}/${id}/atender`,
        {},
      )
      .pipe(timeout(15000));
  }
}
