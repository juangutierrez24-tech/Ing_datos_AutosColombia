
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  LucideCar,
  LucideCheck,
  LucideSearch,
  LucideTriangleAlert,
  LucideX,
} from "@lucide/angular";

import {
  ErrorApi,
  TIPOS_VEHICULO,
  TipoVehiculo,
  Vehiculo,
  VehiculoCrear,
} from "../../models/vehiculo";
import { ApiService } from "../../services/api.service";
import { AlertasService } from "../../services/alertas.service";

@Component({
  selector: "app-operator-vehicles",
  standalone: true,
  imports: [
    FormsModule,
    LucideCar,
    LucideCheck,
    LucideSearch,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: "./operator-vehicles.component.html",
})
export class OperatorVehiclesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly alertasService = inject(AlertasService);

  readonly vehicles = signal<Vehiculo[]>([]);
  readonly total = signal(0);

  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly savingVehicle = signal(false);

  readonly modalOpen = signal(false);
  readonly registerModalOpen = signal(false);
  readonly sent = signal(false);

  readonly errorMessage = signal("");
  readonly successMessage = signal("");
  readonly registerErrorMessage = signal("");

  readonly search = signal("");

  readonly tiposVehiculo = TIPOS_VEHICULO;

  readonly filteredVehicles = computed(() => {
    const text = this.search().trim().toUpperCase();

    if (!text) {
      return this.vehicles();
    }

    return this.vehicles().filter((vehicle) =>
      vehicle.placa.toUpperCase().includes(text),
    );
  });

  selected: Vehiculo | null = null;
  description = "";

  newVehicle: {
    placa: string;
    marca: string;
    modelo: number | null;
    color: string;
    tipo: TipoVehiculo;
  } = this.emptyVehicleForm();

  ngOnInit(): void {
    this.loadVehicles();
  }

  private emptyVehicleForm() {
    return {
      placa: "",
      marca: "",
      modelo: null,
      color: "",
      tipo: "AUTOMOVIL" as TipoVehiculo,
    };
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.errorMessage.set("");

    this.api.list(0, 100).subscribe({
      next: (response) => {
        this.vehicles.set(response.items);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            "No fue posible cargar los vehículos.",
          ),
        );
      },
    });
  }

  openRegisterModal(): void {
    this.newVehicle = this.emptyVehicleForm();
    this.registerErrorMessage.set("");
    this.registerModalOpen.set(true);
  }

  closeRegisterModal(): void {
    if (this.savingVehicle()) {
      return;
    }

    this.registerModalOpen.set(false);
    this.registerErrorMessage.set("");
    this.newVehicle = this.emptyVehicleForm();
  }

  saveVehicle(): void {
    if (this.savingVehicle()) {
      return;
    }

    const placa = this.newVehicle.placa.trim().toUpperCase();
    const marca = this.newVehicle.marca.trim();
    const color = this.newVehicle.color.trim();
    const modelo = this.newVehicle.modelo;

    this.registerErrorMessage.set("");

    if (!placa || !marca || !color || modelo === null) {
      this.registerErrorMessage.set(
        "Todos los campos son obligatorios.",
      );
      return;
    }

    if (!/^[A-Z]{3}[0-9]{3}$/.test(placa)) {
      this.registerErrorMessage.set(
        "La placa debe tener 3 letras seguidas de 3 números. Ejemplo: ABC123.",
      );
      return;
    }

    if (
      !Number.isInteger(modelo) ||
      modelo < 1 ||
      modelo > 9999
    ) {
      this.registerErrorMessage.set(
        "El modelo debe ser un año entero entre 1 y 9999.",
      );
      return;
    }

    const data: VehiculoCrear = {
      placa,
      marca,
      modelo,
      color,
      tipo: this.newVehicle.tipo,
    };

    this.savingVehicle.set(true);

    this.api.create(data).subscribe({
      next: () => {
        this.savingVehicle.set(false);
        this.registerModalOpen.set(false);
        this.newVehicle = this.emptyVehicleForm();

        this.successMessage.set(
          "Vehículo registrado correctamente.",
        );

        this.loadVehicles();
      },
      error: (error) => {
        this.savingVehicle.set(false);

        this.registerErrorMessage.set(
          this.getErrorMessage(
            error,
            "No fue posible registrar el vehículo.",
          ),
        );
      },
    });
  }

  report(vehicle: Vehiculo): void {
    this.selected = vehicle;
    this.description = "";
    this.sent.set(false);
    this.successMessage.set("");
    this.errorMessage.set("");
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.sending()) {
      return;
    }

    this.modalOpen.set(false);
    this.selected = null;
    this.description = "";
  }

  send(): void {
    if (
      !this.selected ||
      !this.description.trim() ||
      this.sending()
    ) {
      return;
    }

    this.sending.set(true);
    this.errorMessage.set("");

    this.alertasService
      .crear({
        vehiculo_id: this.selected.id,
        descripcion: this.description.trim(),
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.modalOpen.set(false);
          this.sent.set(true);

          this.successMessage.set(
            "Alerta registrada correctamente. Un administrador revisará la información.",
          );

          this.selected = null;
          this.description = "";
        },
        error: (error) => {
          this.sending.set(false);

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "No fue posible registrar la alerta.",
            ),
          );
        },
      });
  }

  displayType(type: TipoVehiculo): string {
    switch (type) {
      case "MOTO":
        return "Moto";

      case "AUTOMOVIL":
        return "Automóvil";

      case "CAMIONETA":
        return "Camioneta";

      default:
        return type;
    }
  }

  displayModel(vehicle: Vehiculo): string {
    return `${vehicle.marca} ${vehicle.modelo}`;
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    const apiError = error as {
      error?: ErrorApi;
    };

    const detail = apiError.error?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item.msg)
        .filter(Boolean)
        .join(" ");
    }

    return fallback;
  }
}
