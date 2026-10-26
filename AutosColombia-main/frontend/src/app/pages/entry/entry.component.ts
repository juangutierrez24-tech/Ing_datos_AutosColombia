import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideCar, LucideCheck, LucideSearch, LucideX } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-entry",
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, LucideCar, LucideCheck, LucideSearch, LucideX],
  templateUrl: "./entry.component.html",
})
export class EntryComponent {
  plate = "";
  readonly searched = signal(false);
  readonly confirmed = signal(false);
  search(): void {
    this.plate = this.plate.trim().toUpperCase();
    this.searched.set(/^[A-Z]{3}\d{3}$/.test(this.plate));
  }
  confirm(): void { this.confirmed.set(true); }
}
