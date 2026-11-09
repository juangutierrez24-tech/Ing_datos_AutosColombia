import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideArrowLeft, LucideCheck, LucideFilter, LucideTriangleAlert } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-alerts",
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, LucideArrowLeft, LucideCheck, LucideFilter, LucideTriangleAlert],
  templateUrl: "./alerts.component.html",
})
export class AlertsComponent {
  readonly detail = signal(false);
  readonly attended = signal(false);
  brand = "Renault"; model = "Duster 2022"; color = "Gris"; type = "Camioneta";
  readonly rows = [
    ["AL-024","KLM482","Laura Gómez","04/11/2026 · 09:12","El color registrado no coincide.","Pendiente"],
    ["AL-023","TQP103","Juan Pérez","04/11/2026 · 08:05","El modelo del vehículo es incorrecto.","En revisión"],
    ["AL-022","ABC123","Ana Gómez","03/11/2026 · 16:40","La marca debe ser Chevrolet.","Atendida"],
  ];
  tone(status: string): "red" | "blue" | "gray" { return status === "Pendiente" ? "red" : status === "En revisión" ? "blue" : "gray"; }
}
