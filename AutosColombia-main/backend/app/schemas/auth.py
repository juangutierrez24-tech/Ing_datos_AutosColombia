
"""Esquemas para autenticación y sesiones."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.usuario import Password, Username


class LoginRequest(BaseModel):
    """Credenciales enviadas para iniciar sesión."""

    model_config = ConfigDict(extra="forbid")

    username: Username
    password: Password


class UsuarioAutenticadoRespuesta(BaseModel):
    """Información del usuario y operador autenticados."""

    model_config = ConfigDict(extra="forbid")

    id: int
    operador_id: int
    username: str
    rol: Literal["ADMINISTRADOR", "OPERADOR"]
    nombre_operador: str


class TokenRespuesta(BaseModel):
    """Token de acceso y datos del usuario autenticado."""

    model_config = ConfigDict(extra="forbid")

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    usuario: UsuarioAutenticadoRespuesta
