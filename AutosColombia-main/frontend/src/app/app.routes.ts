import { Routes } from "@angular/router";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { EntryComponent } from "./pages/entry/entry.component";
import { ExitComponent } from "./pages/exit/exit.component";
import { VehicleSearchComponent } from "./pages/vehicle-search/vehicle-search.component";
import { ManagementComponent } from "./pages/management/management.component";
import { HistoryComponent } from "./pages/history/history.component";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "panel" },
  { path: "panel", component: DashboardComponent, title: "Panel principal" },
  { path: "entrada", component: EntryComponent, title: "Registrar entrada" },
  { path: "salida", component: ExitComponent, title: "Registrar salida" },
  { path: "consultar", component: VehicleSearchComponent, title: "Consultar vehículo" },
  { path: "vehiculos", component: ManagementComponent, data: { type: "Vehículos" }, title: "Vehículos" },
  { path: "celdas", component: ManagementComponent, data: { type: "Celdas" }, title: "Celdas" },
  { path: "operadores", component: ManagementComponent, data: { type: "Operadores" }, title: "Operadores" },
  { path: "historial", component: HistoryComponent, title: "Historial" },
  { path: "**", redirectTo: "panel" },
];
