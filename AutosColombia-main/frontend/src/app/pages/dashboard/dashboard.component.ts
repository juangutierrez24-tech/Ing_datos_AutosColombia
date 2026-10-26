import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  LucideCar, LucideCheck, LucideChevronRight, LucideCircleParking,
  LucideLogIn, LucideLogOut, LucideMoreHorizontal,
} from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LucideCar, LucideCheck, LucideChevronRight, LucideCircleParking, LucideLogIn, LucideLogOut, LucideMoreHorizontal],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent {
  readonly stats = [
    { title: "Vehículos dentro", value: "38", hint: "2 más que ayer", icon: "car", tone: "blue" },
    { title: "Celdas ocupadas", value: "38", hint: "61% de ocupación", icon: "parking", tone: "navy" },
    { title: "Celdas disponibles", value: "24", hint: "Listas para asignar", icon: "check", tone: "green" },
    { title: "Entradas hoy", value: "47", hint: "Última a las 10:32", icon: "login", tone: "purple" },
    { title: "Salidas hoy", value: "31", hint: "Última a las 10:21", icon: "logout", tone: "orange" },
  ];
  readonly stays = [
    ["KLM482", "Renault Duster · Gris", "A-12", "08:42", "Dentro"],
    ["TQP103", "Mazda 3 · Rojo", "B-07", "08:16", "Dentro"],
    ["FJR719", "Yamaha NMAX · Negro", "M-04", "07:55", "Dentro"],
    ["ABC123", "Chevrolet Onix · Blanco", "A-05", "07:31", "Finalizada"],
    ["NVS638", "Kia Picanto · Plata", "B-11", "06:48", "Finalizada"],
  ];
}
