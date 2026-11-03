import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import {
  LucideCar,
  LucideCircleParking,
  LucideClock3,
  LucideSearch,
  LucideUserRound,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../../shared/status-badge.component";
import { EstanciasService } from "../../services/estancias.service";
import { Vehiculo } from "../../models/vehiculo";
import { EstanciaHistorial } from "../../models/estancia";

@Component({
  selector: "app-vehicle-search",
  standalone: true,
  imports: [
    FormsModule,
    StatusBadgeComponent,
    LucideCar,
    LucideCircleParking,
    LucideClock3,
    LucideSearch,
    LucideUserRound,
  ],
  templateUrl: "./vehicle-search.component.html",
})
export class VehicleSearchComponent {
  private readonly estanciasService = inject(EstanciasService);

  plate = "";

  readonly vehicle = signal<Vehiculo | null>(null);
  readonly dentro = signal(false);
  readonly historial = signal<EstanciaHistorial[]>([]);
  readonly estanciaActiva = signal<EstanciaHistorial | null>(null);

  readonly searching = signal(false);
  readonly error = signal("");

  search(): void {
    const placa = this.plate.trim().toUpperCase();

    this.plate = placa;
    this.vehicle.set(null);
    this.dentro.set(false);
    this.historial.set([]);
    this.estanciaActiva.set(null);
    this.error.set("");

    if (!/^[A-Z]{3}[0-9]{3}$/.test(placa)) {
      this.error.set("Ingresa una placa válida. Ejemplo: ABC123.");
      return;
    }

    this.searching.set(true);

    this.estanciasService.consultar(placa).subscribe({
      next: (data) => {
        this.vehicle.set(data.vehiculo);
        this.dentro.set(data.esta_dentro);

        this.estanciasService.historial({
          placa,
          estado: "todos",
          offset: 0,
          limit: 100,
        }).subscribe({
          next: (resultado) => {
            this.historial.set(resultado.items);

            const activa = resultado.items.find(
              estancia => estancia.salida === null
            );

            this.estanciaActiva.set(activa ?? null);
            this.searching.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.searching.set(false);
            this.error.set(
              err.error?.detail ??
              "Se encontró el vehículo, pero no fue posible cargar su historial."
            );
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.searching.set(false);

        if (err.status === 404) {
          this.error.set("No encontramos un vehículo registrado con esa placa.");
        } else {
          this.error.set(
            err.error?.detail ??
            "No fue posible consultar el vehículo. Verifica que el backend esté disponible."
          );
        }
      },
    });
  }

  fechaHora(fecha: string | null): string {
    if (!fecha) return "—";

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Bogota",
    }).format(new Date(fecha));
  }

  duracion(entrada: string, salida: string | null): string {
    const inicio = new Date(entrada).getTime();
    const fin = salida ? new Date(salida).getTime() : Date.now();

    const minutos = Math.max(0, Math.floor((fin - inicio) / 60000));
    const horas = Math.floor(minutos / 60);
    const restantes = minutos % 60;

    if (horas === 0) {
      return `${restantes} min`;
    }

    return `${horas} h ${restantes} min`;
  }
}
