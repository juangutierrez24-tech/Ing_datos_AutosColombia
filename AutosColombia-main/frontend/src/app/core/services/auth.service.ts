
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";

import {
  LoginRequest,
  LoginResponse,
  UsuarioAutenticado,
} from "../models/auth.model";

export const AUTH_TOKEN_KEY = "autos_colombia_access_token";
export const AUTH_USER_KEY = "autos_colombia_user";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /**
   * Envía las credenciales al backend.
   * Si son correctas, guarda el token y el usuario.
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>("/auth/login", credentials)
      .pipe(
        tap((response) => {
          sessionStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
          sessionStorage.setItem(
            AUTH_USER_KEY,
            JSON.stringify(response.usuario),
          );
        }),
      );
  }

  /**
   * Obtiene el JWT almacenado.
   */
  getToken(): string | null {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Obtiene los datos del usuario autenticado.
   */
  getCurrentUser(): UsuarioAutenticado | null {
    const storedUser = sessionStorage.getItem(AUTH_USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as UsuarioAutenticado;
    } catch {
      this.clearSession();
      return null;
    }
  }

  /**
   * Comprueba si existe una sesión local válida.
   *
   * La validez real del JWT la comprueba FastAPI
   * cuando recibe una petición protegida.
   */
  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getCurrentUser());
  }

  /**
   * Devuelve la página inicial según el rol.
   */
  getHomeRoute(): string {
    const user = this.getCurrentUser();

    if (user?.rol === "ADMINISTRADOR") {
      return "/admin/inicio";
    }

    if (user?.rol === "OPERADOR") {
      return "/operador/inicio";
    }

    return "/login";
  }

  /**
   * Elimina los datos de sesión.
   */
  private clearSession(): void {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  }

  /**
   * Cierra la sesión y vuelve al login.
   */
  logout(): void {
    this.clearSession();
    this.router.navigateByUrl("/login");
  }
}
