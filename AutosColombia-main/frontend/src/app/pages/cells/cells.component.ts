import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideEdit3, LucidePlus, LucideSearch, LucideX } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-cells",
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, LucideEdit3, LucidePlus, LucideSearch, LucideX],
  templateUrl: "./cells.component.html",
})
export class CellsComponent {
  readonly formOpen = signal(false); readonly editing = signal(false); readonly saved = signal(false);
  code = ""; type = "Automóvil";
  readonly rows = [["A-01","Automóvil","Disponible"],["A-02","Automóvil","Ocupada"],["M-01","Moto","Disponible"],["M-02","Moto","Ocupada"],["C-01","Camioneta","Disponible"]];
  open(edit = false): void { this.editing.set(edit); this.formOpen.set(true); this.code = edit ? "A-01" : ""; this.type = edit ? "Automóvil" : "Automóvil"; }
  save(): void { if (!this.code.trim()) return; this.formOpen.set(false); this.saved.set(true); }
}
