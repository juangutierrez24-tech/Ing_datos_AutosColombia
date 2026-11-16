
import { Component, computed, signal } from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
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
  LucideTriangleAlert,
  LucideUsersRound,
  LucideX,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../shared/status-badge.component";
import { AuthService } from "../core/services/auth.service";
import { UsuarioAutenticado } from "../core/models/auth.model";

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
    LucideUsersRound,
    LucideX,
    LucideTriangleAlert,
  ],
  templateUrl: "./app-shell.component.html",
  styleUrls: ["./app-shell.component.css"],
})
export class AppShellComponent {
  readonly menuOpen = signal(false);
  readonly notificationsOpen = signal(false);

  readonly title = signal("Panel principal");
  readonly isLogin = signal(false);

  readonly currentUser = signal<UsuarioAutenticado | null>(null);

  readonly role = computed(() => {
    const userRole = this.currentUser()?.rol;

    if (userRole === "ADMINISTRADOR") {
      return "Administrador";
    }

    if (userRole === "OPERADOR") {
      return "Operador";
    }

    return "Usuario";
  });

  readonly currentDate = signal(new Date());

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
    {
      label: "Historial de estancias",
      path: "/admin/historial",
      icon: "history",
    },
    {
      label: "Reportar errores",
      path: "/admin/reportar-alerta",
      icon: "alert",
    },
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
    {
      label: "Reportar alerta",
      path: "/operador/reportar-alerta",
      icon: "alert",
    },
  ];

  readonly nav = computed(() =>
    this.currentUser()?.rol === "ADMINISTRADOR"
      ? this.adminNav
      : this.operatorNav
  );

  readonly formattedDate = computed(() =>
    new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Bogota",
    }).format(this.currentDate())
  );

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    this.updateLayout(router.url);

    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateLayout(event.urlAfterRedirects);
        this.menuOpen.set(false);
        this.notificationsOpen.set(false);
      });
  }

  private updateLayout(url: string): void {
    this.isLogin.set(url.startsWith("/login"));

    this.currentUser.set(this.authService.getCurrentUser());

    this.title.set(
      this.router.routerState.snapshot.root.firstChild?.title ??
        "Panel principal"
    );
  }

  getInitials(name: string | undefined): string {
    if (!name?.trim()) {
      return "US";
    }

    const words = name.trim().split(/\s+/);

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
  }

  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  logout(): void {
    this.notificationsOpen.set(false);
    this.authService.logout();
  }
}
