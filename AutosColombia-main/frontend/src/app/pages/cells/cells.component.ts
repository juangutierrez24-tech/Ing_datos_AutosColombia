

import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";

import {
  LucideEdit3,
  LucidePlus,
  LucideSearch,
  LucideX,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../../shared/status-badge.component";
import { CeldasService } from "../../services/celdas.service";

import {
  Celda,
  TipoCelda,
} from "../../models/celda";

@Component({
  selector: "app-cells",
  standalone: true,
  imports: [
    FormsModule,
    StatusBadgeComponent,
    LucideEdit3,
    LucidePlus,
    LucideSearch,
    LucideX,
  ],
  templateUrl: "./cells.component.html",
})
export class CellsComponent implements OnInit {
  private readonly celdasService = inject(CeldasService);

  readonly formOpen = signal(false);
  readonly editing = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly saved = signal(false);

  readonly cells = signal<Celda[]>([]);
  readonly total = signal(0);
  readonly offset = signal(0);
  readonly limit = 100;

  readonly selectedCellId = signal<number | null>(null);

  readonly errorMessage = signal("");
  readonly successMessage = signal("");

  code = "";
  type: TipoCelda = "Automóvil";

  search = "";
  selectedType = "";

  readonly rows = computed(() => {
    const normalizedSearch = this.search.trim().toUpperCase();

    return this.cells().filter((cell) => {
      const matchesCode =
        !normalizedSearch ||
        cell.codigo.toUpperCase().includes(normalizedSearch);

      const matchesType =
        !this.selectedType ||
        cell.tipo === this.selectedType;

      return matchesCode && matchesType;
    });
  });

  readonly motoCount = computed(
    () => this.cells().filter((cell) => cell.tipo === "Moto").length,
  );

  readonly automobileCount = computed(
    () =>
      this.cells().filter((cell) => cell.tipo === "Automóvil").length,
  );

  readonly truckCount = computed(
    () =>
      this.cells().filter((cell) => cell.tipo === "Camioneta").length,
  );

  ngOnInit(): void {
    this.loadCells();
  }

  /**
   * Consulta las celdas registradas.
   */
  loadCells(): void {
    this.loading.set(true);
    this.errorMessage.set("");

    this.celdasService
      .listar(this.offset(), this.limit)
      .subscribe({
        next: (response) => {
          this.cells.set(response.items);
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
   * Abre el formulario para crear o editar.
   */
  open(edit = false, cell?: Celda): void {
    this.errorMessage.set("");
    this.successMessage.set("");

    this.editing.set(edit);

    if (edit && cell) {
      this.selectedCellId.set(cell.id);
      this.code = cell.codigo;
      this.type = cell.tipo;
    } else {
      this.selectedCellId.set(null);
      this.code = "";
      this.type = "Automóvil";
    }

    this.formOpen.set(true);
  }

  /**
   * Cierra el formulario sin guardar.
   */
  closeForm(): void {
    this.formOpen.set(false);
    this.selectedCellId.set(null);
    this.code = "";
    this.type = "Automóvil";
  }

  /**
   * Registra o actualiza una celda.
   */
  save(): void {
    const normalizedCode = this.code.trim().toUpperCase();

    if (!normalizedCode || this.saving()) {
      return;
    }

    this.errorMessage.set("");
    this.successMessage.set("");

    this.saving.set(true);

    const data = {
      codigo: normalizedCode,
      tipo: this.type,
    };

    const request = this.editing()
      ? this.celdasService.actualizar(
          this.selectedCellId()!,
          data,
        )
      : this.celdasService.crear(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();

        this.successMessage.set(
          this.editing()
            ? "Celda actualizada correctamente."
            : "Celda registrada correctamente.",
        );

        this.loadCells();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  /**
   * Elimina una celda después de confirmar.
   */
  delete(cell: Celda): void {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la celda ${cell.codigo}?`,
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage.set("");
    this.successMessage.set("");

    this.celdasService.eliminar(cell.id).subscribe({
      next: () => {
        this.successMessage.set(
          `La celda ${cell.codigo} fue eliminada correctamente.`,
        );

        this.loadCells();
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  /**
   * Cambia de página.
   */
  previousPage(): void {
    if (this.offset() === 0) {
      return;
    }

    this.offset.set(Math.max(0, this.offset() - this.limit));
    this.loadCells();
  }

  nextPage(): void {
    if (this.offset() + this.limit >= this.total()) {
      return;
    }

    this.offset.update((value) => value + this.limit);
    this.loadCells();
  }

  tone(_cell: Celda): "green" | "blue" {
    // La API todavía no informa si la celda está ocupada.
    return "blue";
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
        return "La celda solicitada no existe.";
      }

      return `Error del servidor (${error.status}).`;
    }

    return "Ocurrió un error inesperado.";
  }
}
