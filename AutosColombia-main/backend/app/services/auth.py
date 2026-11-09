"""Servicios para la autenticación de usuarios."""

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import RegistroLogin, Usuario
from app.security import create_access_token, verify_password


class AuthError(Exception):
    """Error controlado durante la autenticación."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def authenticate_user(
    session: Session,
    username: str,
    password: str,
) -> dict:
    """Valida credenciales, registra el login y genera un JWT."""

    normalized_username = username.strip().lower()

    try:
        user = session.scalar(
            select(Usuario).where(
                Usuario.username == normalized_username
            )
        )

        # El mismo mensaje evita revelar si el username existe.
        if user is None or not verify_password(
            password,
            user.password_hash,
        ):
            raise AuthError(
                401,
                "Usuario o contraseña incorrectos.",
            )

        # Se genera el token antes del commit.
        # No se devuelve hasta que el registro de login se guarde.
        access_token = create_access_token(str(user.id))

        login_record = RegistroLogin(usuario_id=user.id)
        session.add(login_record)
        session.commit()

        return {
            "access_token": access_token,
            "usuario": user,
        }

    except AuthError:
        raise

    except SQLAlchemyError:
        session.rollback()
        raise AuthError(
            503,
            "No se pudo registrar el inicio de sesión.",
        ) from None
