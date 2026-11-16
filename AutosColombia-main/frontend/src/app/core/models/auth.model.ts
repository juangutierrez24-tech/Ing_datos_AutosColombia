
/**
 * Datos enviados al backend para iniciar sesión.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Roles disponibles en Autos Colombia.
 */
export type UserRole = "ADMINISTRADOR" | "OPERADOR";

/**
 * Información del usuario autenticado.
 */
export interface UsuarioAutenticado {
  id: number;
  operador_id: number;
  username: string;
  rol: UserRole;
  nombre_operador: string;
}

/**
 * Respuesta de POST /auth/login.
 */
export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  usuario: UsuarioAutenticado;
}
