import {Component, OnInit, computed, inject, signal,} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";

import {
  LucideArrowLeft,
  LucideCheck,
  LucideFilter,
  LucideTriangleAlert,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../../shared/status-badge.component";
import { AlertasService } from "../../services/alertas.service";

import {
  Alerta,
  EstadoAlerta,
  TipoVehiculoAlerta,
  VehiculoAlertaActualizar,
} from "../../models/alerta";

@Component({
  selector: "app-alerts",
  standalone: true,
  imports: [
    FormsModule,
    StatusBadgeComponent,
    LucideArrowLeft,
    LucideCheck,
    LucideFilter,
    LucideTriangleAlert,
  ],
  templateUrl: "./alerts.component.html",
})
export class AlertsComponent implements OnInit {
  private readonly alertasService = inject(AlertasService);

  readonly detail = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly attending = signal(false);

  readonly alerts = signal<Alerta[]>([]);
  readonly selectedAlert = signal<Alerta | null>(null);

  readonly total = signal(0);
  readonly offset = signal(0);
  readonly limit = 20;

  readonly errorMessage = signal("");
  readonly successMessage = signal("");

  // Filtros
  estado = "";
  fecha = "";
  placa = "";
  operadorId = "";

  // Datos editables del vehículo
  brand = "";
  model: number | null = null;
  color = "";
  type: TipoVehiculoAlerta = "AUTOMOVIL";

  readonly rows = computed(() =>
    this.alerts().map((alerta) => ({
      id: alerta.id,
      code: this.formatId(alerta.id),
      plate: alerta.placa,
      operator: alerta.operador,
      date: this.formatDate(alerta.fecha_hora),
      description: alerta.descripcion,
      status: this.statusLabel(alerta.estado),
      state: alerta.estado,
    })),
  );

  readonly operators = computed(() => {
    const unique = new Map<number, string>();

    for (const alerta of this.alerts()) {
      unique.set(alerta.operador_id, alerta.operador);
    }

    return Array.from(unique.entries()).map(([id, nombre]) => ({
      id,
      nombre,
    }));
  });

  readonly pendingCount = computed(
    () => this.alerts().filter(
      (alerta) => alerta.estado === "PENDIENTE",
    ).length,
  );

  ngOnInit(): void {
    this.loadAlerts();
  }

  /**
   * Consulta las alertas al backend.
   */
  loadAlerts(): void {
    this.loading.set(true);
    this.errorMessage.set("");

    const filtros = {
      offset: this.offset(),
      limit: this.limit,
      ...(this.estado && {
        estado: this.estado as EstadoAlerta,
      }),
      ...(this.fecha && {
        fecha_desde: this.fecha,
        fecha_hasta: this.fecha,
      }),
      ...(this.placa.trim() && {
        placa: this.placa.trim().toUpperCase(),
      }),
      ...(this.operadorId && {
        operador_id: Number(this.operadorId),
      }),
    };

    this.alertasService.listar(filtros).subscribe({
      next: (response) => {
        this.alerts.set(response.items);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  /**
   * Aplica los filtros desde el inicio de la paginación.
   */
  applyFilters(): void {
    this.offset.set(0);
    this.loadAlerts();
  }

  /**
   * Limpia los filtros.
   */
  clearFilters(): void {
    this.estado = "";
    this.fecha = "";
    this.placa = "";
    this.operadorId = "";

    this.offset.set(0);
    this.loadAlerts();
  }

  previousPage(): void {
    if (this.offset() === 0) {
      return;
    }

    this.offset.set(Math.max(0, this.offset() - this.limit));
    this.loadAlerts();
  }

  nextPage(): void {
    if (this.offset() + this.limit >= this.total()) {
      return;
    }

    this.offset.update((value) => value + this.limit);
    this.loadAlerts();
  }

  /**
   * Abre el detalle consultando nuevamente la alerta.
   */
  openDetail(id: number): void {
    this.errorMessage.set("");
    this.successMessage.set("");

    this.alertasService.obtener(id).subscribe({
      next: (alerta) => {
        this.selectedAlert.set(alerta);

        this.brand = alerta.marca;
        this.model = alerta.modelo;
        this.color = alerta.color;
        this.type = alerta.tipo;

        this.detail.set(true);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  /**
   * Vuelve a la lista.
   */
  closeDetail(): void {
    this.detail.set(false);
    this.selectedAlert.set(null);
  }

  /**
   * Guarda los cambios del vehículo.
   */
  saveChanges(): void {
    const alerta = this.selectedAlert();

    if (!alerta || this.saving()) {
      return;
    }

    if (
      !this.brand.trim() ||
      !this.color.trim() ||
      this.model === null ||
      !Number.isInteger(this.model) ||
      this.model < 1 ||
      this.model > 9999
    ) {
      this.errorMessage.set(
        "Completa marca, color y un año válido entre 1 y 9999.",
      );
      return;
    }

    const data: VehiculoAlertaActualizar = {
      marca: this.brand.trim(),
      modelo: this.model,
      color: this.color.trim(),
      tipo: this.type,
    };

    this.saving.set(true);
    this.errorMessage.set("");
    this.successMessage.set("");

    this.alertasService
      .actualizarVehiculo(alerta.id, data)
      .subscribe({
        next: (actualizada) => {
          this.selectedAlert.set(actualizada);
          this.brand = actualizada.marca;
          this.model = actualizada.modelo;
          this.color = actualizada.color;
          this.type = actualizada.tipo;

          this.saving.set(false);
          this.successMessage.set(
            "Los datos del vehículo se actualizaron correctamente.",
          );

          this.loadAlerts();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }

  /**
   * Atiende una alerta pendiente.
   */
  attendAlert(): void {
    const alerta = this.selectedAlert();

    if (
      !alerta ||
      alerta.estado === "ATENDIDA" ||
      this.attending()
    ) {
      return;
    }

    this.attending.set(true);
    this.errorMessage.set("");
    this.successMessage.set("");

    this.alertasService.atender(alerta.id).subscribe({
      next: (actualizada) => {
        this.selectedAlert.set(actualizada);
        this.attending.set(false);

        this.successMessage.set(
          "La alerta fue atendida correctamente.",
        );

        this.loadAlerts();
      },
      error: (error: unknown) => {
        this.attending.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  tone(status: string): "red" | "blue" | "gray" {
    if (status === "PENDIENTE" || status === "Pendiente") {
      return "red";
    }

    if (status === "ATENDIDA" || status === "Atendida") {
      return "gray";
    }

    return "blue";
  }

  statusLabel(status: EstadoAlerta): string {
    return status === "PENDIENTE" ? "Pendiente" : "Atendida";
  }

  formatId(id: number): string {
    return `AL-${String(id).padStart(3, "0")}`;
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = error.error?.detail;

      if (typeof detail === "string") {
        return detail;
      }

      if (error.status === 0) {
        return "No fue posible conectar con el servidor.";
      }

      if (error.status === 401) {
        return "Tu sesión expiró. Inicia sesión nuevamente.";
      }

      if (error.status === 403) {
        return "No tienes permisos para realizar esta operación.";
      }

      if (error.status === 404) {
        return "La alerta o el recurso solicitado no existe.";
      }

      return `Error del servidor (${error.status}).`;
    }

    return "Ocurrió un error inesperado.";
  }
}
