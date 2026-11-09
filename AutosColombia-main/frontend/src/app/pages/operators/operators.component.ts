import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideEdit3, LucideSearch, LucideUserPlus, LucideX } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-operators",
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, LucideEdit3, LucideSearch, LucideUserPlus, LucideX],
  templateUrl: "./operators.component.html",
})
export class OperatorsComponent {
  readonly formOpen = signal(false);
  readonly editing = signal(false);
  readonly saved = signal(false);
  readonly submitted = signal(false);
  name = ""; phone = ""; username = ""; password = "";
  readonly rows = [
    ["Carolina Ramírez","cramirez","300 456 7812","Operador"],
    ["Luis Hernández","lhernandez","315 609 2234","Operador"],
    ["Laura Gómez","lgomez","310 882 1640","Operador"],
    ["Miguel Torres","mtorres","301 447 8921","Operador"],
  ];
  open(edit = false): void {
    this.editing.set(edit); this.formOpen.set(true); this.submitted.set(false);
    if (edit) { this.name = "Carolina Ramírez"; this.phone = "300 456 7812"; this.username = "cramirez"; this.password = ""; }
    else { this.name = ""; this.phone = ""; this.username = ""; this.password = ""; }
  }
  save(): void {
    this.submitted.set(true);
    if (!this.name || !this.phone || !this.username || (!this.editing() && this.password.length < 8)) return;
    this.formOpen.set(false); this.saved.set(true);
  }
}
