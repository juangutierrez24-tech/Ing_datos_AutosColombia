"""Endpoints para la gestión de cuentas de usuario."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from app.database import get_session
from app.dependencies import require_roles
from app.models import Usuario
from app.schemas.usuario import (
    UsuarioActualizar,
    UsuarioCrear,
    UsuarioRespuesta,
    UsuariosPagina,
)
from app.services import usuario as service


router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

DatabaseSession = Annotated[Session, Depends(get_session)]
AdminUser = Annotated[
    Usuario,
    Depends(require_roles("ADMINISTRADOR")),
]

UserId = Annotated[
    int,
    Path(ge=1, le=9223372036854775807),
]


@router.post(
    "",
    response_model=UsuarioRespuesta,
    status_code=201,
)
def create(
    data: UsuarioCrear,
    session: DatabaseSession,
    admin: AdminUser,
) -> Usuario:
    """Crea una cuenta asociada a un operador."""

    try:
        return service.create_user(session, data)
    except service.UsuarioError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None


@router.get(
    "",
    response_model=UsuariosPagina,
)
def list_all(
    session: DatabaseSession,
    admin: AdminUser,
    offset: Annotated[
        int,
        Query(ge=0, le=9223372036854775807),
    ] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    """Lista las cuentas con paginación."""

    try:
        return service.list_users(session, offset, limit)
    except service.UsuarioError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None


@router.get(
    "/{id}",
    response_model=UsuarioRespuesta,
)
def get_one(
    id: UserId,
    session: DatabaseSession,
    admin: AdminUser,
) -> Usuario:
    """Consulta una cuenta por su identificador."""

    try:
        return service.get_user(session, id)
    except service.UsuarioError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None


@router.patch(
    "/{id}",
    response_model=UsuarioRespuesta,
)
def update(
    id: UserId,
    data: UsuarioActualizar,
    session: DatabaseSession,
    admin: AdminUser,
) -> Usuario:
    """Actualiza los datos permitidos de una cuenta."""

    try:
        return service.update_user(session, id, data)
    except service.UsuarioError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None
