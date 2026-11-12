
"""Endpoints para la gestión de alertas de vehículos."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.database import get_session
from app.dependencies import require_roles
from app.models import Usuario
from app.schemas.alerta import (
    AlertaCrear,
    AlertaRespuesta,
    EstadoAlerta,
    VehiculoAlertaActualizar,
)
from app.services import alerta as service


router = APIRouter(
    prefix="/alertas",
    tags=["Alertas"],
)


# DEPENDENCIAS
DatabaseSession = Annotated[
    Session,
    Depends(get_session),
]

OperatorUser = Annotated[
    Usuario,
    Depends(require_roles("OPERADOR")),
]

AdminUser = Annotated[
    Usuario,
    Depends(require_roles("ADMINISTRADOR")),
]

AlertId = Annotated[
    int,
    Path(ge=1, le=9223372036854775807),
]


# CREACIÓN DE ALERTAS
@router.post(
    "",
    response_model=AlertaRespuesta,
    status_code=201,
)
def create(
    data: AlertaCrear,
    session: DatabaseSession,
    operator: OperatorUser,
) -> dict:
    """Permite al operador reportar un error de un vehículo."""

    try:
        return service.create_alert(
            session,
            data,
            operator.operador_id,
        )
    except service.AlertaError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None


# CONSULTA DE ALERTAS
@router.get("")
def list_all(
    session: DatabaseSession,
    admin: AdminUser,
    offset: Annotated[int, Query(ge=0, le=9223372036854775807)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: EstadoAlerta | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    placa: Annotated[str | None, Query(min_length=1, max_length=20)] = None,
    operador_id: Annotated[
        int | None,
        Query(ge=1, le=9223372036854775807),
    ] = None,
) -> dict:
    """Lista alertas con filtros y paginación."""

    try:
        return service.list_alerts(
            session=session,
            offset=offset,
            limit=limit,
            estado=estado,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            placa=placa,
            operador_id=operador_id,
        )
    except service.AlertaError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None


# CONSULTA INDIVIDUAL
@router.get(
    "/{id}",
    response_model=AlertaRespuesta,
)
def get_one(
    id: AlertId,
    session: DatabaseSession,
    admin: AdminUser,
) -> dict:
    """Consulta el detalle de una alerta."""

    try:
        return service.get_alert(session, id)
    except service.AlertaError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None


# CORRECCIÓN DEL VEHÍCULO
@router.patch(
    "/{id}/vehiculo",
    response_model=AlertaRespuesta,
)
def update_vehicle(
    id: AlertId,
    data: VehiculoAlertaActualizar,
    session: DatabaseSession,
    admin: AdminUser,
) -> dict:
    """Permite al administrador corregir los datos del vehículo."""

    try:
        return service.update_alert_vehicle(
            session,
            id,
            data,
        )
    except service.AlertaError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None


# ATENCIÓN DE ALERTAS
@router.patch(
    "/{id}/atender",
    response_model=AlertaRespuesta,
)
def attend(
    id: AlertId,
    session: DatabaseSession,
    admin: AdminUser,
) -> dict:
    """Marca una alerta como atendida."""

    try:
        return service.attend_alert(
            session,
            id,
            admin.id,
        )
    except service.AlertaError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None
