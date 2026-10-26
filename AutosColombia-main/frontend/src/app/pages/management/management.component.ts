import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { LucideChevronLeft, LucideChevronRight, LucideMoreHorizontal, LucideSearch } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

type EntityType = "Vehículos" | "Celdas" | "Operadores";

@Component({
  selector: "app-management",
  standalone: true,
  imports: [StatusBadgeComponent, LucideChevronLeft, LucideChevronRight, LucideMoreHorizontal, LucideSearch],
  templateUrl: "./management.component.html",
})
export class ManagementComponent {
  readonly type = signal(inject(ActivatedRoute).snapshot.data["type"] as EntityType);
  readonly notice = signal("");
  readonly data = computed(() => ({
    Vehículos: {
      columns: ["Placa", "Marca", "Modelo o año", "Color", "Tipo"],
      rows: [["KLM482","Renault","Duster 2022","Gris","Camioneta"],["TQP103","Mazda","3 2021","Rojo","Automóvil"],["FJR719","Yamaha","NMAX 2023","Negro","Moto"],["ABC123","Chevrolet","Onix 2020","Blanco","Automóvil"],["NVS638","Kia","Picanto 2022","Plata","Automóvil"]],
      total: 124,
    },
    Celdas: {
      columns: ["Código", "Tipo", "Estado", "Vehículo asignado"],
      rows: [["A-12","Camioneta","Ocupada","KLM482"],["A-13","Automóvil","Disponible","—"],["B-07","Automóvil","Ocupada","TQP103"],["B-08","Automóvil","Disponible","—"],["M-04","Moto","Ocupada","FJR719"]],
      total: 62,
    },
    Operadores: {
      columns: ["Identificador", "Nombre", "Teléfono", "Estado"],
      rows: [["OP-001","Carolina Ramírez","300 456 7812","Activo"],["OP-002","Luis Hernández","315 609 2234","Activo"],["OP-003","Laura Gómez","310 882 1640","Activo"],["OP-004","Miguel Torres","301 447 8921","Inactivo"]],
      total: 4,
    },
  })[this.type()]);
  isStatus(value: string): boolean { return ["Ocupada", "Disponible", "Activo", "Inactivo"].includes(value); }
  badgeTone(value: string): "green" | "blue" | "gray" { return value === "Disponible" || value === "Activo" ? "green" : value === "Ocupada" ? "blue" : "gray"; }
  register(): void { this.notice.set(`Formulario demostrativo para registrar ${this.singular().toLowerCase()}. No se guardarán datos.`); }
  singular(): string { return this.type() === "Vehículos" ? "Vehículo" : this.type() === "Celdas" ? "Celda" : "Operador"; }
}
