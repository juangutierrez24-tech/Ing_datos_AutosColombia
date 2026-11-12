
"""Endpoints para consultar el historial de inicios de sesión."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_session
from app.dependencies import require_roles
from app.models import Usuario
from app.schemas.registro_login import RegistroLoginRespuesta
from app.services import registro_login as service


router = APIRouter(
    prefix="/registro-login",
    tags=["Registro de Login"],
)


# DEPENDENCIAS
DatabaseSession = Annotated[
    Session,
    Depends(get_session),
]

AdminUser = Annotated[
    Usuario,
    Depends(require_roles("ADMINISTRADOR")),
]


# CONSULTA DEL HISTORIAL
@router.get("", response_model=list[RegistroLoginRespuesta])
def list_all(
    session: DatabaseSession,
    admin: AdminUser,
    offset: Annotated[int, Query(ge=0, le=9223372036854775807)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[dict]:
    """Consulta el historial de inicios de sesión."""

    try:
        return service.list_login_records(
            session=session,
            offset=offset,
            limit=limit,
        )
    except service.RegistroLoginError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None
