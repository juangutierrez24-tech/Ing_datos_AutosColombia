
import { Routes } from "@angular/router";

import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { EntryComponent } from "./pages/entry/entry.component";
import { ExitComponent } from "./pages/exit/exit.component";
import { VehicleSearchComponent } from "./pages/vehicle-search/vehicle-search.component";
import { ManagementComponent } from "./pages/management/management.component";
import { HistoryComponent } from "./pages/history/history.component";
import { LoginComponent } from "./pages/login/login.component";
import { OperatorsComponent } from "./pages/operators/operators.component";
import { LoginHistoryComponent } from "./pages/login-history/login-history.component";
import { OperatorVehiclesComponent } from "./pages/operator-vehicles/operator-vehicles.component";
import { AlertsComponent } from "./pages/alerts/alerts.component";
import { CellsComponent } from "./pages/cells/cells.component";
import { RoleDashboardComponent } from "./pages/role-dashboard/role-dashboard.component";

import { authGuard } from "./core/guards/auth.guard";
import { roleGuard } from "./core/guards/role.guard";

const ADMIN = ["ADMINISTRADOR"];
const OPERADOR = ["OPERADOR"];
const AMBOS = ["ADMINISTRADOR", "OPERADOR"];

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "login",
  },

  {
    path: "login",
    component: LoginComponent,
    title: "Iniciar sesión",
  },

  // --------------------------------------------------
  // ADMINISTRADOR
  // --------------------------------------------------

  {
    path: "admin/inicio",
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Panel del administrador",
  },
  {
    path: "admin/vehiculos",
    component: OperatorVehiclesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Vehículos",
  },
  {
    path: "admin/entrada",
    component: EntryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Registrar entrada",
  },
  {
    path: "admin/salida",
    component: ExitComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Registrar salida",
  },
  {
    path: "admin/dentro",
    component: VehicleSearchComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Vehículos dentro",
  },
  {
    path: "admin/historial",
    component: HistoryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Historial de estancias",
  },
  {
    path: "admin/reportar-alerta",
    component: OperatorVehiclesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Reportar errores de vehículos",
  },
  {
    path: "admin/operadores",
    component: OperatorsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Gestión de operadores",
  },
  {
    path: "admin/celdas",
    component: CellsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Gestión de celdas",
  },
  {
    path: "admin/sesiones",
    component: LoginHistoryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Historial de inicios de sesión",
  },
  {
    path: "admin/alertas",
    component: AlertsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN },
    title: "Alertas de vehículos",
  },

  // --------------------------------------------------
  // OPERADOR
  // --------------------------------------------------

  {
    path: "operador/inicio",
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: OPERADOR },
    title: "Panel del operador",
  },
  {
    path: "operador/vehiculos",
    component: OperatorVehiclesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: OPERADOR },
    title: "Vehículos",
  },
  {
    path: "operador/entrada",
    component: EntryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: OPERADOR },
    title: "Registrar entrada",
  },
  {
    path: "operador/salida",
    component: ExitComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: OPERADOR },
    title: "Registrar salida",
  },
  {
    path: "operador/dentro",
    component: VehicleSearchComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: OPERADOR },
    title: "Vehículos dentro",
  },
  {
    path: "operador/historial",
    component: HistoryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: OPERADOR },
    title: "Historial",
  },
  {
    path: "operador/reportar-alerta",
    component: OperatorVehiclesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: OPERADOR },
    title: "Reportar alerta",
  },

  // --------------------------------------------------
  // RUTAS GENERALES COMPARTIDAS
  // --------------------------------------------------

  {
    path: "panel",
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: AMBOS },
    title: "Panel principal",
  },
  {
    path: "entrada",
    component: EntryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: AMBOS },
    title: "Registrar entrada",
  },
  {
    path: "salida",
    component: ExitComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: AMBOS },
    title: "Registrar salida",
  },
  {
    path: "consultar",
    component: VehicleSearchComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: AMBOS },
    title: "Consultar vehículo",
  },
  {
    path: "historial",
    component: HistoryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: AMBOS },
    title: "Historial",
  },

  // --------------------------------------------------
  // GESTIÓN ADMINISTRATIVA
  // --------------------------------------------------

  {
    path: "vehiculos",
    component: ManagementComponent,
    canActivate: [authGuard, roleGuard],
    data: { type: "Vehículos", roles: ADMIN },
    title: "Vehículos",
  },
  {
    path: "celdas",
    component: ManagementComponent,
    canActivate: [authGuard, roleGuard],
    data: { type: "Celdas", roles: ADMIN },
    title: "Celdas",
  },
  {
    path: "operadores",
    component: ManagementComponent,
    canActivate: [authGuard, roleGuard],
    data: { type: "Operadores", roles: ADMIN },
    title: "Operadores",
  },

  {
    path: "**",
    redirectTo: "login",
  },
];
