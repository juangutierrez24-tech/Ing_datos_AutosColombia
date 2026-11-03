
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { timeout } from 'rxjs';
import { API_BASE_URL } from './api.service';

export interface UltimaEstancia {
  id: number;
  placa: string;
  marca: string;
  modelo: number;
  color: string;
  tipo: string;
  celda: string;
  entrada: string;
  salida: string | null;
  estado: 'Dentro' | 'Finalizada';
}

export interface DashboardResumen {
  vehiculos_dentro: number;
  celdas_ocupadas: number;
  celdas_disponibles: number;
  entradas_hoy: number;
  salidas_hoy: number;
  ultimas_estancias: UltimaEstancia[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  resumen() {
    return this.http
      .get<DashboardResumen>(`${this.base}/estancias/resumen`)
      .pipe(timeout(15000));
  }
}
