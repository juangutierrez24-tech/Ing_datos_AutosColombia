
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { UserRole } from "../models/auth.model";
import { AuthService } from "../services/auth.service";

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (!authService.isAuthenticated() || !user) {
    return router.createUrlTree(["/login"]);
  }

  const allowedRoles = route.data["roles"] as UserRole[] | undefined;

  // Si la ruta no define roles, solo requiere autenticación.
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (allowedRoles.includes(user.rol)) {
    return true;
  }

  // Un usuario no puede entrar a páginas de otro rol.
  return router.createUrlTree([authService.getHomeRoute()]);
};
