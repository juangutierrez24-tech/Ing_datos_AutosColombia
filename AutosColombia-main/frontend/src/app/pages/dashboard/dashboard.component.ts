import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import {
  LucideCar,
  LucideCheck,
  LucideChevronRight,
  LucideCircleParking,
  LucideLogIn,
  LucideLogOut,
  LucideRefreshCw,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../../shared/status-badge.component";
import {
  DashboardService,
  UltimaEstancia
} from "../../services/dashboard.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    RouterLink,
    StatusBadgeComponent,
    LucideCar,
    LucideCheck,
    LucideChevronRight,
    LucideCircleParking,
    LucideLogIn,
    LucideLogOut,
    LucideRefreshCw,
  ],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly resumen = signal({
    vehiculos_dentro: 0,
    celdas_ocupadas: 0,
    celdas_disponibles: 0,
    entradas_hoy: 0,
    salidas_hoy: 0,
    ultimas_estancias: [] as UltimaEstancia[],
  });

  readonly loading = signal(false);
  readonly error = signal("");

  readonly stats = computed(() => [
    {
      title: "Vehículos dentro",
      value: this.resumen().vehiculos_dentro,
      hint: "Vehículos actualmente en el parqueadero",
      icon: "car",
      tone: "blue",
    },
    {
      title: "Celdas ocupadas",
      value: this.resumen().celdas_ocupadas,
      hint: "Celdas con una estancia activa",
      icon: "parking",
      tone: "navy",
    },
    {
      title: "Celdas disponibles",
      value: this.resumen().celdas_disponibles,
      hint: "Listas para asignar",
      icon: "check",
      tone: "green",
    },
    {
      title: "Entradas hoy",
      value: this.resumen().entradas_hoy,
      hint: "Movimientos registrados hoy",
      icon: "login",
      tone: "purple",
    },
    {
      title: "Salidas hoy",
      value: this.resumen().salidas_hoy,
      hint: "Movimientos finalizados hoy",
      icon: "logout",
      tone: "orange",
    },
  ]);

  readonly stays = computed(() => this.resumen().ultimas_estancias);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set("");

    this.dashboardService.resumen().subscribe({
      next: data => {
        this.resumen.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          "No fue posible cargar el resumen. Verifica que el backend esté disponible."
        );
        this.loading.set(false);
      },
    });
  }

  hora(fecha: string): string {
    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota",
    }).format(new Date(fecha));
  }

  descripcionVehiculo(estancia: UltimaEstancia): string {
    return `${estancia.marca} ${estancia.modelo} · ${estancia.color}`;
  }
}
