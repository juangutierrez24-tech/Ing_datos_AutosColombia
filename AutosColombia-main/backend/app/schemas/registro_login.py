"""Esquemas para la consulta del historial de inicios de sesión."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RegistroLoginRespuesta(BaseModel):
    """Información de un inicio de sesión realizado."""

    model_config = ConfigDict(extra="forbid")

    id: int
    operador: str
    username: str
    fecha_hora: datetime