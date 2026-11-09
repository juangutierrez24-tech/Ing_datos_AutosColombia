import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LucideCar, LucideCircleParking, LucideLogIn, LucideLogOut, LucidePlus, LucideSearch, LucideTriangleAlert, LucideUsersRound } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-role-dashboard",
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LucideCar, LucideCircleParking, LucideLogIn, LucideLogOut, LucidePlus, LucideSearch, LucideTriangleAlert, LucideUsersRound],
  templateUrl: "./role-dashboard.component.html",
})
export class RoleDashboardComponent {
  readonly role = inject(ActivatedRoute).snapshot.data["role"] as "Administrador" | "Operador";
  readonly isAdmin = this.role === "Administrador";
  readonly stats = this.isAdmin
    ? [["Vehículos dentro","38","car"],["Celdas disponibles","24","parking"],["Celdas ocupadas","38","car"],["Operadores registrados","12","users"],["Alertas pendientes","6","alert"]]
    : [["Vehículos dentro","38","car"],["Celdas disponibles","24","parking"],["Entradas hoy","47","login"],["Salidas hoy","31","logout"]];
  readonly adminActions = [
    ["Registrar vehículo","/admin/vehiculos","plus"],
    ["Registrar entrada","/admin/entrada","login"],
    ["Registrar salida","/admin/salida","logout"],
    ["Consultar vehículos dentro","/admin/dentro","search"],
    ["Registrar operador","/admin/operadores","users"],
    ["Registrar celda","/admin/celdas","parking"],
    ["Consultar alertas","/admin/alertas","alert"],
  ];
}
