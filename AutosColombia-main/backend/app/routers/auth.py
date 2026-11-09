"""Endpoints de autenticación."""

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated

from fastapi import Depends

from app.database import get_session
from app.schemas.auth import LoginRequest, TokenRespuesta
from app.services import auth as service


router = APIRouter(prefix="/auth", tags=["Autenticación"])

DatabaseSession = Annotated[Session, Depends(get_session)]


@router.post("/login", response_model=TokenRespuesta)
def login(
    data: LoginRequest,
    session: DatabaseSession,
) -> dict:
    """Autentica al usuario y devuelve un token de acceso."""

    try:
        return service.authenticate_user(
            session,
            data.username,
            data.password,
        )

    except service.AuthError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None
