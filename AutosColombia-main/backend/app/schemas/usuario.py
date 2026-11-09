
"""Esquemas para la gestión de cuentas de usuario."""

from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    field_validator,
)


RolUsuario = Literal["ADMINISTRADOR", "OPERADOR"]


def validar_username(value):
    """Valida y normaliza el nombre de usuario."""
    if not isinstance(value, str):
        raise ValueError("El nombre de usuario debe ser texto.")

    value = value.strip().lower()

    if not value:
        raise ValueError("El nombre de usuario no puede estar vacío.")

    return value


def validar_password(value):
    """Comprueba que la contraseña no esté vacía."""
    if not isinstance(value, str):
        raise ValueError("La contraseña debe ser texto.")

    if not value.strip():
        raise ValueError("La contraseña no puede estar vacía.")

    # No se modifica la contraseña: los espacios pueden formar parte de ella.
    return value


Username = Annotated[str, BeforeValidator(validar_username)]
Password = Annotated[str, BeforeValidator(validar_password)]


class UsuarioCrear(BaseModel):
    """Datos necesarios para crear una cuenta de usuario."""

    model_config = ConfigDict(extra="forbid")

    operador_id: int
    username: Username
    password: Password
    rol: RolUsuario


class UsuarioActualizar(BaseModel):
    """Datos permitidos para actualizar una cuenta."""

    model_config = ConfigDict(extra="forbid")

    username: Username | None = None
    password: Password | None = None
    rol: RolUsuario | None = None

    @field_validator("*", mode="before")
    @classmethod
    def reject_null(cls, value):
        if value is None:
            raise ValueError("Los campos enviados no pueden ser nulos.")
        return value


class UsuarioRespuesta(BaseModel):
    """Información pública de una cuenta de usuario."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int
    operador_id: int
    username: str
    rol: RolUsuario


class UsuariosPagina(BaseModel):
    """Respuesta paginada de usuarios."""

    items: list[UsuarioRespuesta]
    total: int
    offset: int
    limit: int
