
import { Component, computed, signal } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { filter } from "rxjs";
import {
  LucideBell,
  LucideCalendarDays,
  LucideCar,
  LucideChevronDown,
  LucideCircleParking,
  LucideHistory,
  LucideLayoutDashboard,
  LucideLogIn,
  LucideLogOut,
  LucideMenu,
  LucideSearch,
  LucideShieldCheck,
  LucideUsersRound,
  LucideX,
  LucideTriangleAlert,
} from "@lucide/angular";
import { StatusBadgeComponent } from "../shared/status-badge.component";

type NavItem = {
  label: string;
  path: string;
  icon: string;
  heading?: string;
};

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    StatusBadgeComponent,
    LucideBell,
    LucideCalendarDays,
    LucideCar,
    LucideChevronDown,
    LucideCircleParking,
    LucideHistory,
    LucideLayoutDashboard,
    LucideLogIn,
    LucideLogOut,
    LucideMenu,
    LucideSearch,
    LucideShieldCheck,
    LucideUsersRound,
    LucideX,
    LucideTriangleAlert,
  ],
  templateUrl: "./app-shell.component.html",
})
export class AppShellComponent {
  readonly menuOpen = signal(false);
  readonly title = signal("Panel principal");
  readonly isLogin = signal(false);

  readonly role = signal<"Administrador" | "Operador">("Operador");

  readonly adminNav: NavItem[] = [
    {
      label: "Inicio",
      path: "/admin/inicio",
      icon: "dashboard",
      heading: "Operación del parqueadero",
    },
    { label: "Vehículos", path: "/admin/vehiculos", icon: "car" },
    { label: "Registrar entrada", path: "/admin/entrada", icon: "login" },
    { label: "Registrar salida", path: "/admin/salida", icon: "logout" },
    { label: "Vehículos dentro", path: "/admin/dentro", icon: "search" },
    { label: "Historial de estancias", path: "/admin/historial", icon: "history" },
    { label: "Reportar errores", path: "/admin/reportar-alerta", icon: "alert" },
    {
      label: "Gestión de operadores",
      path: "/admin/operadores",
      icon: "users",
      heading: "Administración del sistema",
    },
    { label: "Gestión de celdas", path: "/admin/celdas", icon: "parking" },
    { label: "Inicios de sesión", path: "/admin/sesiones", icon: "history" },
    { label: "Gestión de alertas", path: "/admin/alertas", icon: "alert" },
  ];

  readonly operatorNav: NavItem[] = [
    { label: "Inicio", path: "/operador/inicio", icon: "dashboard" },
    { label: "Vehículos", path: "/operador/vehiculos", icon: "car" },
    { label: "Registrar entrada", path: "/operador/entrada", icon: "login" },
    { label: "Registrar salida", path: "/operador/salida", icon: "logout" },
    { label: "Vehículos dentro", path: "/operador/dentro", icon: "search" },
    { label: "Historial", path: "/operador/historial", icon: "history" },
    { label: "Reportar alerta", path: "/operador/reportar-alerta", icon: "alert" },
  ];

  readonly nav = computed(() =>
    this.role() === "Administrador" ? this.adminNav : this.operatorNav
  );

  constructor(private readonly router: Router) {
    // Reconocer la ruta inicial.
    this.updateLayout(router.url);

    // Actualizar la interfaz al cambiar de ruta.
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateLayout(event.urlAfterRedirects);
        this.menuOpen.set(false);
      });
  }

  private updateLayout(url: string): void {
    this.isLogin.set(url.startsWith("/login"));

    if (url.startsWith("/admin")) {
      this.role.set("Administrador");
    } else if (url.startsWith("/operador")) {
      this.role.set("Operador");
    }

    this.title.set(
      this.router.routerState.snapshot.root.firstChild?.title ??
        "Panel principal"
    );
  }

  logout(): void {
    this.router.navigateByUrl("/login");
  }
}
