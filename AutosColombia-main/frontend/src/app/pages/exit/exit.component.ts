
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import {
  LucideCar,
  LucideLogOut,
  LucideSearch,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../../shared/status-badge.component";
import { EstanciasService } from "../../services/estancias.service";
import { EstadoVehiculo } from "../../models/estancia";
import { Vehiculo } from "../../models/vehiculo";
import { Operador } from "../../models/operador";

@Component({
  selector: "app-exit",
  standalone: true,
  imports: [
    FormsModule,
    StatusBadgeComponent,
    LucideCar,
    LucideLogOut,
    LucideSearch,
  ],
  templateUrl: "./exit.component.html",
})
export class ExitComponent {
  private readonly estanciasService = inject(EstanciasService);

  plate = "";
  operadorId: number | null = null;

  readonly found = signal(false);
  readonly searching = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);

  readonly vehicle = signal<Vehiculo | null>(null);
  readonly estancia = signal<EstadoVehiculo["estancia"]>(null);
  readonly operadores = signal<Operador[]>([]);

  readonly error = signal("");
  readonly result = signal("");

  constructor() {
    this.loadOperadores();
  }

  loadOperadores(): void {
    this.estanciasService.operadores().subscribe({
      next: (data) => this.operadores.set(data),
      error: () => {
        this.error.set("No fue posible cargar los operadores.");
      },
    });
  }

  search(): void {
    const placa = this.plate.trim().toUpperCase();

    this.plate = placa;
    this.found.set(false);
    this.vehicle.set(null);
    this.estancia.set(null);
    this.modalOpen.set(false);
    this.error.set("");
    this.result.set("");

    if (!/^[A-Z]{3}[0-9]{3}$/.test(placa)) {
      this.error.set("Ingresa una placa válida. Ejemplo: ABC123.");
      return;
    }

    this.searching.set(true);

    this.estanciasService.consultar(placa).subscribe({
      next: (data) => {
        this.searching.set(false);

        if (!data.esta_dentro || !data.estancia) {
          this.error.set("El vehículo no tiene una estancia activa.");
          return;
        }

        this.vehicle.set(data.vehiculo);
        this.estancia.set(data.estancia);
        this.found.set(true);
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

  confirm(): void {
    const vehicle = this.vehicle();

    if (!vehicle || this.operadorId === null) {
      this.error.set("Selecciona el operador que registra la salida.");
      this.modalOpen.set(false);
      return;
    }

    this.saving.set(true);
    this.error.set("");

    this.estanciasService.salida({
      placa: vehicle.placa,
      operador_id: this.operadorId,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.found.set(false);
        this.vehicle.set(null);
        this.estancia.set(null);
        this.operadorId = null;
        this.result.set(
          `La salida del vehículo ${vehicle.placa} se registró correctamente.`
        );
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.error.set(
          err.error?.detail ??
          "No fue posible registrar la salida. Intenta nuevamente."
        );
      },
    });
  }

  fechaHora(fecha: string): string {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Bogota",
    }).format(new Date(fecha));
  }

  tiempoTranscurrido(fecha: string): string {
    const minutos = Math.max(
      0,
      Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
    );

    const horas = Math.floor(minutos / 60);
    const restantes = minutos % 60;

    if (horas === 0) {
      return `${restantes} min`;
    }

    return `${horas} h ${restantes} min`;
  }
}
