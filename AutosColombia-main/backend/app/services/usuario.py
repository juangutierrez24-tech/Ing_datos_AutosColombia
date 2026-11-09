
"""Servicios para la gestión de cuentas de usuario."""

from functools import wraps

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Operador, Usuario
from app.schemas.usuario import UsuarioActualizar, UsuarioCrear
from app.security import hash_password


# EXCEPCIONES

class UsuarioError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


# MANEJO DE OPERACIONES CON BASE DE DATOS

def database_operation(operation):
    """Centraliza rollback y mensajes públicos de errores de DB."""

    @wraps(operation)
    def wrapped(session: Session, *args, **kwargs):
        try:
            return operation(session, *args, **kwargs)

        except IntegrityError as error:
            session.rollback()

            code = getattr(error.orig, "sqlstate", None)
            diagnostic = getattr(error.orig, "diag", None)
            constraint = getattr(
                diagnostic, "constraint_name", None
            )

            if constraint == "uq_usuario_username":
                raise UsuarioError(
                    409,
                    "El nombre de usuario ya está registrado.",
                ) from None

            if constraint == "uq_usuario_operador":
                raise UsuarioError(
                    409,
                    "El operador ya tiene una cuenta de usuario.",
                ) from None

            if code == "23503":
                raise UsuarioError(
                    404,
                    "El operador asociado no existe.",
                ) from None

            if code in {"23502", "23514"}:
                raise UsuarioError(
                    422,
                    "Los datos incumplen las restricciones del usuario.",
                ) from None

            raise UsuarioError(
                409,
                "La operación entra en conflicto con los datos existentes.",
            ) from None

        except SQLAlchemyError:
            session.rollback()
            raise UsuarioError(
                503,
                "No se pudo completar la operación con la base de datos.",
            ) from None

    return wrapped


# FUNCIONES AUXILIARES

def find_user(session: Session, user_id: int) -> Usuario:
    """Busca una cuenta por su identificador."""

    user = session.get(Usuario, user_id)

    if user is None:
        raise UsuarioError(404, "Usuario no encontrado.")

    return user


def find_operator(session: Session, operator_id: int) -> Operador:
    """Comprueba que exista el operador asociado a la cuenta."""

    operator = session.get(Operador, operator_id)

    if operator is None:
        raise UsuarioError(404, "Operador no encontrado.")

    return operator


# CREACIÓN DE USUARIOS

@database_operation
def create_user(session: Session, data: UsuarioCrear) -> Usuario:
    """Crea una cuenta y almacena únicamente el hash de su contraseña."""

    find_operator(session, data.operador_id)

    user = Usuario(
        operador_id=data.operador_id,
        username=data.username,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


# CONSULTA DE USUARIOS

@database_operation
def list_users(
    session: Session,
    offset: int,
    limit: int,
) -> dict:
    """Lista las cuentas con paginación."""

    total = session.scalar(
        select(func.count()).select_from(Usuario)
    )

    items = list(
        session.scalars(
            select(Usuario)
            .order_by(Usuario.id)
            .offset(offset)
            .limit(limit)
        )
    )

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@database_operation
def get_user(session: Session, user_id: int) -> Usuario:
    """Consulta una cuenta por su identificador."""

    return find_user(session, user_id)


# ACTUALIZACIÓN DE USUARIOS

@database_operation
def update_user(
    session: Session,
    user_id: int,
    data: UsuarioActualizar,
) -> Usuario:
    """Actualiza los datos permitidos de una cuenta."""

    user = find_user(session, user_id)

    changes = data.model_dump(exclude_unset=True)

    if "password" in changes:
        changes["password_hash"] = hash_password(
            changes.pop("password")
        )

    for key, value in changes.items():
        setattr(user, key, value)

    session.commit()
    session.refresh(user)

    return user
