
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideFilter, LucideRotateCcw } from "@lucide/angular";

import { RegistroLogin } from "../../models/registro-login";
import { RegistroLoginService } from "../../services/registro-login.service";

@Component({
  selector: "app-login-history",
  standalone: true,
  imports: [FormsModule, LucideFilter, LucideRotateCcw],
  templateUrl: "./login-history.component.html",
})
export class LoginHistoryComponent implements OnInit {
  private readonly registroLoginService = inject(RegistroLoginService);

  // DATOS
  readonly rows = signal<RegistroLogin[]>([]);
  readonly loading = signal(false);
  readonly error = signal("");

  // FILTROS
  readonly operadorSeleccionado = signal("");
  readonly fechaDesde = signal("");
  readonly fechaHasta = signal("");

  readonly filtroOperador = signal("");
  readonly filtroDesde = signal("");
  readonly filtroHasta = signal("");

  // OPERADORES DISPONIBLES
  readonly operadores = computed(() => {
    const nombres = this.rows().map((row) => row.operador);
    return [...new Set(nombres)].sort((a, b) => a.localeCompare(b, "es"));
  });

  // REGISTROS FILTRADOS
  readonly registrosFiltrados = computed(() => {
    return this.rows().filter((row) => {
      const operadorCoincide =
        !this.filtroOperador() ||
        row.operador === this.filtroOperador();

      const fecha = this.obtenerFecha(row.fecha_hora);

      const desdeCoincide =
        !this.filtroDesde() || fecha >= this.filtroDesde();

      const hastaCoincide =
        !this.filtroHasta() || fecha <= this.filtroHasta();

      return operadorCoincide && desdeCoincide && hastaCoincide;
    });
  });

  ngOnInit(): void {
    this.cargarRegistros();
  }

  // CONSULTA AL BACKEND
  cargarRegistros(): void {
    this.loading.set(true);
    this.error.set("");

    this.registroLoginService.listar().subscribe({
      next: (registros) => {
        this.rows.set(registros);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        const detail = error.error?.detail;

        this.error.set(
          typeof detail === "string"
            ? detail
            : "No fue posible cargar el historial de inicios de sesión.",
        );
      },
    });
  }

  // APLICAR FILTROS
  aplicarFiltros(): void {
    this.filtroOperador.set(this.operadorSeleccionado());
    this.filtroDesde.set(this.fechaDesde());
    this.filtroHasta.set(this.fechaHasta());
  }

  // LIMPIAR FILTROS
  limpiarFiltros(): void {
    this.operadorSeleccionado.set("");
    this.fechaDesde.set("");
    this.fechaHasta.set("");

    this.filtroOperador.set("");
    this.filtroDesde.set("");
    this.filtroHasta.set("");
  }

  // FORMATO DE FECHA
  obtenerFecha(fechaHora: string): string {
    const fecha = new Date(fechaHora);

    if (Number.isNaN(fecha.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-CA").format(fecha);
  }

  // FORMATO DE FECHA PARA LA TABLA
  mostrarFecha(fechaHora: string): string {
    const fecha = new Date(fechaHora);

    if (Number.isNaN(fecha.getTime())) {
      return "Fecha no disponible";
    }

    return fecha.toLocaleDateString("es-CO");
  }

  // FORMATO DE HORA PARA LA TABLA
  mostrarHora(fechaHora: string): string {
    const fecha = new Date(fechaHora);

    if (Number.isNaN(fecha.getTime())) {
      return "--:--";
    }

    return fecha.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
}
