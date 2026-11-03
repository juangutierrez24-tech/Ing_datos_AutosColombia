import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideSearch
} from "@lucide/angular";

import { ApiService } from "../../services/api.service";
import { CeldasService } from "../../services/celdas.service";
import { OperadoresService } from "../../services/operadores.service";

import {
  Vehiculo,
  VehiculoCrear,
  TipoVehiculo,
  TIPOS_VEHICULO
} from "../../models/vehiculo";
import { Celda } from "../../models/celda";
import { Operador } from "../../models/operador";

type EntityType = "Vehículos" | "Celdas" | "Operadores";

interface ManagementRow {
  id: number;
  values: string[];
}

@Component({
  selector: "app-management",
  standalone: true,
  imports: [
    LucideChevronLeft,
    LucideChevronRight,
    LucideSearch
  ],
  templateUrl: "./management.component.html",
  styleUrl: "./management.component.css",
})
export class ManagementComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly vehiclesService = inject(ApiService);
  private readonly cellsService = inject(CeldasService);
  private readonly operatorsService = inject(OperadoresService);

  readonly type = signal(
    this.route.snapshot.data["type"] as EntityType
  );

  readonly rows = signal<ManagementRow[]>([]);
  readonly total = signal(0);
  readonly offset = signal(0);
  readonly limit = 10;

  readonly loading = signal(false);
  readonly error = signal("");
  readonly success = signal("");
  readonly search = signal("");

  readonly mostrarFormulario = signal(false);
  readonly guardando = signal(false);

  readonly tiposVehiculo = TIPOS_VEHICULO;

  readonly formulario = signal({
    placa: "",
    marca: "",
    modelo: "",
    color: "",
    tipo: "AUTOMOVIL" as TipoVehiculo
  });

  readonly columns = computed(() => {
    switch (this.type()) {
      case "Vehículos":
        return ["Placa", "Marca", "Modelo o año", "Color", "Tipo"];
      case "Celdas":
        return ["Código", "Tipo"];
      case "Operadores":
        return ["Identificador", "Nombre", "Teléfono"];
      default:
        return [];
    }
  });

  readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();

    if (!term) return this.rows();

    return this.rows().filter(row =>
      row.values.some(value =>
        value.toLowerCase().includes(term)
      )
    );
  });

  readonly pageNumber = computed(
    () => Math.floor(this.offset() / this.limit) + 1
  );

  readonly totalPages = computed(
    () => Math.max(1, Math.ceil(this.total() / this.limit))
  );

  readonly singular = computed(() => {
    switch (this.type()) {
      case "Vehículos": return "Vehículo";
      case "Celdas": return "Celda";
      case "Operadores": return "Operador";
      default: return "Registro";
    }
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set("");

    const offset = this.offset();

    switch (this.type()) {
      case "Vehículos":
        this.loadVehicles(offset);
        break;
      case "Celdas":
        this.loadCells(offset);
        break;
      case "Operadores":
        this.loadOperators(offset);
        break;
    }
  }

  private loadVehicles(offset: number): void {
    this.vehiclesService.list(offset, this.limit).subscribe({
      next: page => {
        this.rows.set(page.items.map((vehicle: Vehiculo) => ({
          id: vehicle.id,
          values: [
            vehicle.placa,
            vehicle.marca,
            String(vehicle.modelo),
            vehicle.color,
            vehicle.tipo
          ]
        })));

        this.total.set(page.total);
        this.loading.set(false);
      },
      error: () => this.handleError()
    });
  }

  private loadCells(offset: number): void {
    this.cellsService.list(offset, this.limit).subscribe({
      next: page => {
        this.rows.set(page.items.map((cell: Celda) => ({
          id: cell.id,
          values: [cell.codigo, cell.tipo]
        })));

        this.total.set(page.total);
        this.loading.set(false);
      },
      error: () => this.handleError()
    });
  }

  private loadOperators(offset: number): void {
    this.operatorsService.list(offset, this.limit).subscribe({
      next: page => {
        this.rows.set(page.items.map((operator: Operador) => ({
          id: operator.id,
          values: [
            `OP-${String(operator.id).padStart(3, "0")}`,
            operator.nombre,
            operator.telefono
          ]
        })));

        this.total.set(page.total);
        this.loading.set(false);
      },
      error: () => this.handleError()
    });
  }

  private handleError(): void {
    this.rows.set([]);
    this.total.set(0);
    this.loading.set(false);
    this.error.set(
      "No fue posible cargar los registros. Verifica que el backend esté disponible."
    );
  }

  abrirFormulario(): void {
    this.error.set("");
    this.success.set("");
    this.formulario.set({
      placa: "",
      marca: "",
      modelo: "",
      color: "",
      tipo: "AUTOMOVIL"
    });
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    if (this.guardando()) return;
    this.mostrarFormulario.set(false);
  }

  guardarVehiculo(): void {
    const form = this.formulario();

    const placa = form.placa.trim().toUpperCase();
    const marca = form.marca.trim();
    const color = form.color.trim();
    const modelo = Number(form.modelo);

    if (!/^[A-Z]{3}[0-9]{3}$/.test(placa)) {
      this.error.set(
        "La placa debe tener 3 letras seguidas de 3 números. Ejemplo: ABC123."
      );
      return;
    }

    if (!marca || !color || !form.modelo.trim()) {
      this.error.set("Completa todos los campos obligatorios.");
      return;
    }

    if (!Number.isInteger(modelo) || modelo < 1 || modelo > 9999) {
      this.error.set("Ingresa un modelo válido.");
      return;
    }

    const data: VehiculoCrear = {
      placa,
      marca,
      modelo,
      color,
      tipo: form.tipo
    };

    this.error.set("");
    this.success.set("");
    this.guardando.set(true);

    this.vehiclesService.create(data).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.success.set(`El vehículo ${placa} fue registrado correctamente.`);
        this.offset.set(0);
        this.load();
      },
      error: err => {
        this.guardando.set(false);

        if (err.status === 409) {
          this.error.set("Ya existe un vehículo registrado con esa placa.");
        } else if (Array.isArray(err.error?.detail)) {
          this.error.set(
            err.error.detail.map((e: { msg: string }) => e.msg).join(" ")
          );
        } else {
          this.error.set(
            err.error?.detail || "No fue posible registrar el vehículo."
          );
        }
      }
    });
  }

  previousPage(): void {
    if (this.offset() === 0) return;
    this.offset.update(value => Math.max(0, value - this.limit));
    this.load();
  }

  nextPage(): void {
    if (this.pageNumber() >= this.totalPages()) return;
    this.offset.update(value => value + this.limit);
    this.load();
  }

  register(): void {
    if (this.type() === "Vehículos") {
      this.abrirFormulario();
      return;
    }

    this.error.set(
      "El registro de celdas y operadores corresponde a una entrega posterior."
    );
  }
}
