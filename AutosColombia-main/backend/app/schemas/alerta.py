"""Esquemas para la gestión de alertas de vehículos."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    field_validator,
)

EstadoAlerta = Literal["PENDIENTE", "ATENDIDA"]
TipoVehiculo = Literal["MOTO", "AUTOMOVIL", "CAMIONETA"]


# VALIDACIONES
def validar_texto(value):
    """Comprueba que el texto no esté vacío."""
    if not isinstance(value, str):
        raise ValueError("El campo debe ser texto.")

    value = value.strip()

    if not value:
        raise ValueError("El campo no puede estar vacío.")

    return value


Texto = Annotated[str, BeforeValidator(validar_texto)]


# CREACIÓN DE ALERTAS
class AlertaCrear(BaseModel):
    """Datos necesarios para reportar una alerta."""

    model_config = ConfigDict(extra="forbid")

    vehiculo_id: int
    descripcion: Texto


# ACTUALIZACIÓN DE VEHÍCULOS
class VehiculoAlertaActualizar(BaseModel):
    """Datos del vehículo que el administrador puede corregir."""

    model_config = ConfigDict(extra="forbid")

    marca: Texto | None = None
    modelo: int | None = None
    color: Texto | None = None
    tipo: TipoVehiculo | None = None

    @field_validator("*", mode="before")
    @classmethod
    def reject_null(cls, value):
        if value is None:
            raise ValueError("Los campos enviados no pueden ser nulos.")
        return value

    @field_validator("modelo")
    @classmethod
    def validar_modelo(cls, value):
        if type(value) is not int or not 1 <= value <= 9999:
            raise ValueError(
                "El modelo debe ser un año entero entre 1 y 9999."
            )
        return value


# RESPUESTA DE ALERTAS
class AlertaRespuesta(BaseModel):
    """Información de una alerta y sus datos relacionados."""

    model_config = ConfigDict(extra="forbid")

    id: int

    vehiculo_id: int
    placa: str
    marca: str
    modelo: int
    color: str
    tipo: TipoVehiculo

    operador_id: int
    operador: str

    descripcion: str
    fecha_hora: datetime
    estado: EstadoAlerta

    atendida_por_usuario_id: int | None
    atendida_por_username: str | None
    fecha_atencion: datetime | None
