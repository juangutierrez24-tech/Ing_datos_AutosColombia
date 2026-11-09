
"""Esquemas para autenticación y sesiones."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.usuario import (
    Password,
    Username,
    UsuarioRespuesta,
)


class LoginRequest(BaseModel):
    """Credenciales enviadas para iniciar sesión."""

    model_config = ConfigDict(extra="forbid")

    username: Username
    password: Password


class TokenRespuesta(BaseModel):
    """Token de acceso y datos del usuario autenticado."""

    model_config = ConfigDict(extra="forbid")

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    usuario: UsuarioRespuesta
