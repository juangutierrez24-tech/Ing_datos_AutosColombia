
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import {
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../../shared/status-badge.component";
import { EstanciasService } from "../../services/estancias.service";
import { EstanciaHistorial } from "../../models/estancia";

@Component({
  selector: "app-history",
  standalone: true,
  imports: [
    FormsModule,
    StatusBadgeComponent,
    LucideCalendarDays,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: "./history.component.html",
})
export class HistoryComponent {
  private readonly estanciasService = inject(EstanciasService);

  readonly stays = signal<EstanciaHistorial[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal("");

  placa = "";
  desde = "";
  hasta = "";
  estado: "todos" | "abierta" | "cerrada" = "todos";

  readonly offset = signal(0);
  readonly limit = 10;
Math: any;

  load(): void {
    this.loading.set(true);
    this.error.set("");

    this.estanciasService.historial({
      placa: this.placa.trim().toUpperCase() || undefined,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
      estado: this.estado,
      offset: this.offset(),
      limit: this.limit,
    }).subscribe({
      next: (data) => {
        this.stays.set(data.items);
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.error?.detail ??
          "No fue posible cargar el historial. Verifica que el backend esté disponible."
        );
      },
    });
  }

  applyFilters(): void {
    this.offset.set(0);
    this.load();
  }

  previousPage(): void {
    if (this.offset() === 0) return;

    this.offset.update(value => Math.max(0, value - this.limit));
    this.load();
  }

  nextPage(): void {
    if (this.offset() + this.limit >= this.total()) return;

    this.offset.update(value => value + this.limit);
    this.load();
  }

  get firstItem(): number {
    return this.total() === 0 ? 0 : this.offset() + 1;
  }

  get lastItem(): number {
    return Math.min(this.offset() + this.limit, this.total());
  }

  estadoTexto(estancia: EstanciaHistorial): string {
    return estancia.salida === null ? "Abierta" : "Cerrada";
  }

  fechaHora(fecha: string | null): string {
    if (!fecha) return "—";

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Bogota",
    }).format(new Date(fecha));
  }

  paginaActual(): number {
    return this.total() === 0
      ? 0
      : Math.floor(this.offset() / this.limit) + 1;
  }

  exportar(): void {
    const encabezados = [
      "Placa",
      "Celda",
      "Entrada",
      "Salida",
      "Operador entrada",
      "Operador salida",
      "Estado",
    ];

    const filas = this.stays().map(estancia => [
      estancia.vehiculo.placa,
      estancia.celda.codigo,
      this.fechaHora(estancia.entrada),
      this.fechaHora(estancia.salida),
      estancia.operador_entrada.nombre,
      estancia.operador_salida?.nombre ?? "—",
      this.estadoTexto(estancia),
    ]);

    const contenido = [encabezados, ...filas]
      .map(fila =>
        fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const archivo = new Blob(
      ["\uFEFF" + contenido],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "historial_estancias.csv";
    enlace.click();

    URL.revokeObjectURL(url);
  }

  constructor() {
    this.load();
  }
}
