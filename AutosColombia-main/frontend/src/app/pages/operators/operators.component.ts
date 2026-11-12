import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { finalize, forkJoin, timeout } from "rxjs";

import {
  LucideEdit3,
  LucideSearch,
  LucideUserPlus,
  LucideX,
} from "@lucide/angular";

import { StatusBadgeComponent } from "../../shared/status-badge.component";
import { API_BASE_URL } from "../../services/api.service";


interface Operador {
  id: number;
  nombre: string;
  telefono: string;
}

interface OperadoresPagina {
  items: Operador[];
  total: number;
  offset: number;
  limit: number;
}

type RolUsuario = "ADMINISTRADOR" | "OPERADOR";

interface Usuario {
  id: number;
  operador_id: number;
  username: string;
  rol: RolUsuario;
}

interface UsuariosPagina {
  items: Usuario[];
  total: number;
  offset: number;
  limit: number;
}

interface OperadorCrear {
  nombre: string;
  telefono: string;
}

interface OperadorActualizar {
  nombre?: string;
  telefono?: string;
}

interface UsuarioCrear {
  operador_id: number;
  username: string;
  password: string;
  rol: RolUsuario;
}

interface UsuarioActualizar {
  username?: string;
  password?: string;
  rol?: RolUsuario;
}

interface ErrorApi {
  detail?: string;
}


@Component({
  selector: "app-operators",
  standalone: true,
  imports: [
    FormsModule,
    LucideEdit3,
    LucideUserPlus,
    LucideX,
  ],
  templateUrl: "./operators.component.html",
})
export class OperatorsComponent {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  private readonly operadoresEndpoint = `${this.base}/operadores`;
  private readonly usuariosEndpoint = `${this.base}/usuarios`;

  readonly formOpen = signal(false);
  readonly editing = signal(false);
  readonly saved = signal(false);
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly errorMessage = signal("");
  readonly successMessage = signal("");

  readonly operators = signal<Operador[]>([]);
  readonly users = signal<Usuario[]>([]);

  readonly total = signal(0);

  name = "";
  phone = "";
  username = "";
  password = "";

  selectedOperatorId: number | null = null;
  selectedUserId: number | null = null;

  /**
   * El HTML actual espera filas con esta estructura:
   * [nombre, username, telefono, rol]
   */
  readonly rows = computed(() =>
    this.operators().map((operator) => {
      const user = this.users().find(
        (item) => item.operador_id === operator.id,
      );

      return [
        operator.nombre,
        user?.username ?? "—",
        operator.telefono,
        this.roleLabel(user?.rol),
      ];
    }),
  );

  ngOnInit(): void {
    this.load();
  }

  private roleLabel(rol: RolUsuario | undefined): string {
    return rol === "ADMINISTRADOR" ? "Administrador" : "Operador";
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set("");
    this.saved.set(false);

    forkJoin({
      operadores: this.http
        .get<OperadoresPagina>(this.operadoresEndpoint, {
          params: {
            offset: 0,
            limit: 100,
          },
        })
        .pipe(timeout(15000)),

      usuarios: this.http
        .get<UsuariosPagina>(this.usuariosEndpoint, {
          params: {
            offset: 0,
            limit: 100,
          },
        })
        .pipe(timeout(15000)),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ operadores, usuarios }) => {
          this.operators.set(operadores.items);
          this.users.set(usuarios.items);
          this.total.set(operadores.total);
        },

        error: (error) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "No fue posible cargar los operadores.",
            ),
          );
        },
      });
  }

  open(edit = false): void {
    this.editing.set(edit);
    this.formOpen.set(true);
    this.submitted.set(false);
    this.saved.set(false);
    this.successMessage.set("");
    this.errorMessage.set("");

    if (edit) {
      const operator = this.operators()[0];

      if (!operator) {
        this.errorMessage.set("No hay operadores disponibles para editar.");
        this.formOpen.set(false);
        return;
      }

      this.selectOperator(operator.id);
    } else {
      this.selectedOperatorId = null;
      this.selectedUserId = null;

      this.name = "";
      this.phone = "";
      this.username = "";
      this.password = "";
    }
  }

  /**
   * Prepara los datos del operador para edición.
   *
   * El HTML actual llama open(true), por lo que temporalmente
   * seleccionamos el primero. Cuando actualicemos el HTML,
   * podremos recibir directamente la fila/ID seleccionada.
   */
  private selectOperator(operatorId: number): void {
    const operator = this.operators().find(
      (item) => item.id === operatorId,
    );

    if (!operator) {
      this.errorMessage.set("No se encontró el operador seleccionado.");
      return;
    }

    const user = this.users().find(
      (item) => item.operador_id === operator.id,
    );

    this.selectedOperatorId = operator.id;
    this.selectedUserId = user?.id ?? null;

    this.name = operator.nombre;
    this.phone = operator.telefono;
    this.username = user?.username ?? "";
    this.password = "";
  }

  save(): void {
    this.submitted.set(true);
    this.saved.set(false);
    this.errorMessage.set("");

    if (!this.isFormValid()) {
      return;
    }

    this.saving.set(true);

    if (this.editing()) {
      this.updateOperator();
    } else {
      this.createOperator();
    }
  }

  private isFormValid(): boolean {
    if (!this.name.trim()) {
      return false;
    }

    if (!this.phone.trim()) {
      return false;
    }

    if (!this.username.trim()) {
      return false;
    }

    if (!this.editing() && this.password.length < 8) {
      return false;
    }

    if (this.editing() && this.password && this.password.length < 8) {
      return false;
    }

    return true;
  }

  private createOperator(): void {
    const data: OperadorCrear = {
      nombre: this.name.trim(),
      telefono: this.phone.trim(),
    };

    this.http
      .post<Operador>(this.operadoresEndpoint, data)
      .pipe(timeout(15000))
      .subscribe({
        next: (operator) => {
          this.createUser(operator.id);
        },

        error: (error) => {
          this.saving.set(false);

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "No fue posible registrar el operador.",
            ),
          );
        },
      });
  }

  private createUser(operatorId: number): void {
    const data: UsuarioCrear = {
      operador_id: operatorId,
      username: this.username.trim(),
      password: this.password,
      rol: "OPERADOR",
    };

    this.http
      .post<Usuario>(this.usuariosEndpoint, data)
      .pipe(timeout(15000))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.saved.set(true);

          this.successMessage.set(
            "Operador registrado correctamente.",
          );

          this.load();
        },

        error: (error) => {
          this.saving.set(false);

          /*
           * El operador ya fue creado, pero la cuenta no.
           * No ocultamos el error para que quede claro qué ocurrió.
           */
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "El operador fue creado, pero no fue posible crear su cuenta de acceso.",
            ),
          );

          this.load();
        },
      });
  }

  private updateOperator(): void {
    if (this.selectedOperatorId === null) {
      this.saving.set(false);
      this.errorMessage.set("No se encontró el operador seleccionado.");
      return;
    }

    const operatorData: OperadorActualizar = {
      nombre: this.name.trim(),
      telefono: this.phone.trim(),
    };

    this.http
      .patch<Operador>(
        `${this.operadoresEndpoint}/${this.selectedOperatorId}`,
        operatorData,
      )
      .pipe(timeout(15000))
      .subscribe({
        next: () => {
          this.updateUser();
        },

        error: (error) => {
          this.saving.set(false);

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "No fue posible actualizar el operador.",
            ),
          );
        },
      });
  }

  private updateUser(): void {
    if (this.selectedUserId === null) {
      this.saving.set(false);
      this.formOpen.set(false);
      this.saved.set(true);

      this.successMessage.set(
        "Operador actualizado correctamente.",
      );

      this.load();
      return;
    }

    const data: UsuarioActualizar = {
      username: this.username.trim(),
      rol: "OPERADOR",
    };

    /*
     * La contraseña solo se envía cuando el administrador
     * realmente escribió una nueva.
     */
    if (this.password.trim()) {
      data.password = this.password;
    }

    this.http
      .patch<Usuario>(
        `${this.usuariosEndpoint}/${this.selectedUserId}`,
        data,
      )
      .pipe(timeout(15000))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.saved.set(true);

          this.successMessage.set(
            "Operador actualizado correctamente.",
          );

          this.load();
        },

        error: (error) => {
          this.saving.set(false);

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "El operador se actualizó, pero no fue posible actualizar su cuenta.",
            ),
          );

          this.load();
        },
      });
  }

  closeForm(): void {
    if (this.saving()) {
      return;
    }

    this.formOpen.set(false);
    this.submitted.set(false);
    this.errorMessage.set("");
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    const apiError = error as { error?: ErrorApi };

    const detail = apiError?.error?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item.msg)
        .filter(Boolean)
        .join(" ");
    }

    return fallback;
  }
}