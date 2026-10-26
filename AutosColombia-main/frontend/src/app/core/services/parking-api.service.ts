import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

/**
 * Punto de integración para la futura API FastAPI.
 * No define endpoints ni persiste datos mientras el contrato real no exista.
 */
@Injectable({ providedIn: "root" })
export class ParkingApiService {
  readonly http = inject(HttpClient);
}
