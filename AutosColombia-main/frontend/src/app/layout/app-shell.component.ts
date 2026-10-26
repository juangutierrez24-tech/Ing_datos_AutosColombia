import { Component, signal } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { filter } from "rxjs";
import {
  LucideBell, LucideCalendarDays, LucideCar, LucideChevronDown, LucideCircleParking,
  LucideHistory, LucideLayoutDashboard, LucideLogIn, LucideLogOut, LucideMenu,
  LucideSearch, LucideShieldCheck, LucideUsersRound, LucideX,
} from "@lucide/angular";
import { StatusBadgeComponent } from "../shared/status-badge.component";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, StatusBadgeComponent, LucideBell, LucideCalendarDays,
    LucideCar, LucideChevronDown, LucideCircleParking, LucideHistory, LucideLayoutDashboard,
    LucideLogIn, LucideLogOut, LucideMenu, LucideSearch, LucideShieldCheck, LucideUsersRound, LucideX,
  ],
  templateUrl: "./app-shell.component.html",
})
export class AppShellComponent {
  readonly menuOpen = signal(false);
  readonly title = signal("Panel principal");
  readonly nav = [
    { label: "Panel principal", path: "/panel", icon: "dashboard" },
    { label: "Registrar entrada", path: "/entrada", icon: "login" },
    { label: "Registrar salida", path: "/salida", icon: "logout" },
    { label: "Consultar vehículo", path: "/consultar", icon: "search" },
    { label: "Vehículos", path: "/vehiculos", icon: "car" },
    { label: "Celdas", path: "/celdas", icon: "parking" },
    { label: "Operadores", path: "/operadores", icon: "users" },
    { label: "Historial", path: "/historial", icon: "history" },
  ];

  constructor(router: Router) {
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.title.set(router.routerState.snapshot.root.firstChild?.title ?? "Panel principal");
      this.menuOpen.set(false);
    });
  }
}
