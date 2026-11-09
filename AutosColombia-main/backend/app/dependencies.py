
"""Dependencias para autenticación y autorización."""

from typing import Annotated, Callable

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_session
from app.models import Usuario
from app.security import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)

DatabaseSession = Annotated[Session, Depends(get_session)]


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    session: DatabaseSession,
) -> Usuario:
    """Obtiene el usuario identificado por el token JWT."""

    unauthorized = HTTPException(
        status_code=401,
        detail="No se proporcionaron credenciales válidas.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    payload = decode_access_token(credentials.credentials)

    if payload is None:
        raise unauthorized

    subject = payload.get("sub")

    try:
        user_id = int(subject)
    except (ValueError, TypeError):
        raise unauthorized from None

    if user_id < 1:
        raise unauthorized

    try:
        user = session.get(Usuario, user_id)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="No se pudo consultar el usuario.",
        ) from None

    if user is None:
        raise unauthorized

    return user


def require_roles(*allowed_roles: str) -> Callable:
    """Crea una dependencia que restringe el acceso por rol."""

    valid_roles = {"ADMINISTRADOR", "OPERADOR"}

    if not allowed_roles or not set(allowed_roles).issubset(valid_roles):
        raise ValueError("Se deben indicar roles válidos.")

    def role_checker(
        current_user: Annotated[
            Usuario,
            Depends(get_current_user),
        ],
    ) -> Usuario:
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para realizar esta operación.",
            )

        return current_user

    return role_checker
