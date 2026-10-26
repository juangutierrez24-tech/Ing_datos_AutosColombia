import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideCar, LucideCircleParking, LucideClock3, LucideSearch, LucideUserRound } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-vehicle-search",
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, LucideCar, LucideCircleParking, LucideClock3, LucideSearch, LucideUserRound],
  templateUrl: "./vehicle-search.component.html",
})
export class VehicleSearchComponent {
  plate = "KLM482";
  readonly visible = signal(true);
  search(): void { this.visible.set(this.plate.trim().toUpperCase() === "KLM482"); }
}
