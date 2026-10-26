import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideCar, LucideLogOut, LucideSearch } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-exit",
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, LucideCar, LucideLogOut, LucideSearch],
  templateUrl: "./exit.component.html",
})
export class ExitComponent {
  plate = "TQP103";
  readonly found = signal(true);
  readonly modalOpen = signal(false);
  readonly result = signal("");
  search(): void { this.found.set(this.plate.trim().toUpperCase() === "TQP103"); this.result.set(""); }
  confirm(): void { this.modalOpen.set(false); this.result.set("Salida simulada correctamente. No se guardaron datos."); }
}
