
"""Servicios para la consulta del historial de inicios de sesión."""

from functools import wraps

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import RegistroLogin, Usuario, Operador


# EXCEPCIONES
class RegistroLoginError(Exception):
    """Error controlado durante la consulta del historial."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


# MANEJO DE OPERACIONES CON BASE DE DATOS
def database_operation(operation):
    """Centraliza el manejo de errores de base de datos."""

    @wraps(operation)
    def wrapped(session: Session, *args, **kwargs):
        try:
            return operation(session, *args, **kwargs)
        except SQLAlchemyError:
            session.rollback()
            raise RegistroLoginError(
                503,
                "No se pudo consultar el historial de inicios de sesión.",
            ) from None

    return wrapped


# CONSULTA DEL HISTORIAL
@database_operation
def list_login_records(
    session: Session,
    offset: int,
    limit: int,
) -> list[dict]:
    """Consulta los inicios de sesión más recientes."""

    statement = (
        select(
            RegistroLogin.id,
            Operador.nombre.label("operador"),
            Usuario.username,
            RegistroLogin.fecha_hora,
        )
        .join(RegistroLogin.usuario)
        .join(Usuario.operador)
        .order_by(RegistroLogin.fecha_hora.desc(), RegistroLogin.id.desc())
        .offset(offset)
        .limit(limit)
    )

    records = session.execute(statement).mappings().all()

    return [dict(record) for record in records]
