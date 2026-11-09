import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideCar, LucideCheck, LucideSearch, LucideTriangleAlert, LucideX } from "@lucide/angular";

@Component({
  selector: "app-operator-vehicles",
  standalone: true,
  imports: [FormsModule, LucideCar, LucideCheck, LucideSearch, LucideTriangleAlert, LucideX],
  templateUrl: "./operator-vehicles.component.html",
})
export class OperatorVehiclesComponent {
  readonly modalOpen = signal(false);
  readonly sent = signal(false);
  description = "";
  selected = ["KLM482","Renault","Duster 2022","Gris","Camioneta"];
  readonly rows = [
    ["KLM482","Renault","Duster 2022","Gris","Camioneta"],
    ["TQP103","Mazda","3 2021","Rojo","Automóvil"],
    ["FJR719","Yamaha","NMAX 2023","Negro","Moto"],
    ["ABC123","Chevrolet","Onix 2020","Blanco","Automóvil"],
  ];
  report(row: string[]): void { this.selected = row; this.description = ""; this.modalOpen.set(true); }
  send(): void { if (!this.description.trim()) return; this.modalOpen.set(false); this.sent.set(true); }
}
