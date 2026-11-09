
import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { finalize } from "rxjs";

import {
  LucideCar,
  LucideEye,
  LucideEyeOff,
  LucideLockKeyhole,
  LucideUserRound,
} from "@lucide/angular";

import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    FormsModule,
    LucideCar,
    LucideEye,
    LucideEyeOff,
    LucideLockKeyhole,
    LucideUserRound,
  ],
  templateUrl: "./login.component.html",
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = "";
  password = "";

  readonly showPassword = signal(false);
  readonly submitted = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal("");

  login(): void {
    this.submitted.set(true);
    this.errorMessage.set("");

    if (!this.username.trim() || !this.password) {
      return;
    }

    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);

    this.authService
      .login({
        username: this.username.trim(),
        password: this.password,
      })
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          const role = response.usuario.rol;

          const defaultRoute =
            role === "ADMINISTRADOR"
              ? "/admin/inicio"
              : "/operador/inicio";

          const returnUrl =
            this.route.snapshot.queryParamMap.get("returnUrl");

          const safeReturnUrl =
            returnUrl &&
            returnUrl.startsWith("/") &&
            !returnUrl.startsWith("//")
              ? returnUrl
              : defaultRoute;

          void this.router.navigateByUrl(safeReturnUrl);
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.errorMessage.set(
              "El nombre de usuario o la contraseña son incorrectos.",
            );
            return;
          }

          if (error.status === 0) {
            this.errorMessage.set(
              "No se pudo conectar con el servidor. Comprueba que FastAPI esté funcionando.",
            );
            return;
          }

          this.errorMessage.set(
            "Ocurrió un error al iniciar sesión. Inténtalo nuevamente.",
          );
        },
      });
  }
}
