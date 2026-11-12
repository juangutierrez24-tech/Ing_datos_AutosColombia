
"""Servicios para la gestión de alertas de vehículos."""

from datetime import date, datetime, timezone
from functools import wraps

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Alerta, Operador, Usuario, Vehiculo
from app.schemas.alerta import (
    AlertaCrear,
    VehiculoAlertaActualizar,
)


# EXCEPCIONES
class AlertaError(Exception):
    """Error controlado durante la gestión de alertas."""

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

            if code == "23503":
                raise AlertaError(
                    404,
                    "No existe alguno de los registros relacionados.",
                ) from None

            if code in {"23502", "23514"}:
                raise AlertaError(
                    422,
                    "Los datos incumplen las restricciones de la alerta o del vehículo.",
                ) from None

            if code == "23505":
                raise AlertaError(
                    409,
                    "La operación entra en conflicto con los datos existentes.",
                ) from None

            raise AlertaError(
                409,
                "No se pudo completar la operación por un conflicto de datos.",
            ) from None

        except SQLAlchemyError:
            session.rollback()
            raise AlertaError(
                503,
                "No se pudo completar la operación con la base de datos.",
            ) from None

    return wrapped


# CONSULTA AUXILIAR
def alert_statement():
    """Construye la consulta con los datos relacionados de una alerta."""

    return (
        select(
            Alerta.id.label("id"),
            Alerta.vehiculo_id.label("vehiculo_id"),
            Vehiculo.placa.label("placa"),
            Vehiculo.marca.label("marca"),
            Vehiculo.modelo.label("modelo"),
            Vehiculo.color.label("color"),
            Vehiculo.tipo.label("tipo"),
            Alerta.operador_id.label("operador_id"),
            Operador.nombre.label("operador"),
            Alerta.descripcion.label("descripcion"),
            Alerta.fecha_hora.label("fecha_hora"),
            Alerta.estado.label("estado"),
            Alerta.atendida_por_usuario_id.label(
                "atendida_por_usuario_id"
            ),
            Usuario.username.label("atendida_por_username"),
            Alerta.fecha_atencion.label("fecha_atencion"),
        )
        .join(Vehiculo, Alerta.vehiculo_id == Vehiculo.id)
        .join(Operador, Alerta.operador_id == Operador.id)
        .outerjoin(
            Usuario,
            Alerta.atendida_por_usuario_id == Usuario.id,
        )
    )


def find_alert(session: Session, alert_id: int) -> Alerta:
    """Busca una alerta por su identificador."""

    alert = session.get(Alerta, alert_id)

    if alert is None:
        raise AlertaError(404, "Alerta no encontrada.")

    return alert


def get_alert_data(session: Session, alert_id: int) -> dict:
    """Obtiene una alerta con los datos de vehículo y operadores."""

    result = session.execute(
        alert_statement().where(Alerta.id == alert_id)
    ).mappings().one_or_none()

    if result is None:
        raise AlertaError(404, "Alerta no encontrada.")

    return dict(result)


# CREACIÓN DE ALERTAS
@database_operation
def create_alert(
    session: Session,
    data: AlertaCrear,
    operador_id: int,
) -> dict:
    """Registra una alerta asociada al operador autenticado."""

    if operador_id < 1:
        raise AlertaError(
            422,
            "El usuario autenticado no tiene un operador asociado.",
        )

    vehicle = session.get(Vehiculo, data.vehiculo_id)

    if vehicle is None:
        raise AlertaError(404, "Vehículo no encontrado.")

    operator = session.get(Operador, operador_id)

    if operator is None:
        raise AlertaError(404, "Operador no encontrado.")

    alert = Alerta(
        vehiculo_id=data.vehiculo_id,
        operador_id=operador_id,
        descripcion=data.descripcion,
        estado="PENDIENTE",
    )

    session.add(alert)
    session.commit()

    return get_alert_data(session, alert.id)


# CONSULTA DE ALERTAS
@database_operation
def list_alerts(
    session: Session,
    offset: int,
    limit: int,
    estado: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    placa: str | None = None,
    operador_id: int | None = None,
) -> dict:
    """Consulta alertas con filtros y paginación."""

    if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
        raise AlertaError(
            422,
            "La fecha desde no puede ser posterior a la fecha hasta.",
        )

    statement = alert_statement()
    count_statement = (
        select(func.count(Alerta.id))
        .select_from(Alerta)
        .join(Vehiculo, Alerta.vehiculo_id == Vehiculo.id)
        .join(Operador, Alerta.operador_id == Operador.id)
    )

    filters = []

    if estado is not None:
        filters.append(Alerta.estado == estado)

    if fecha_desde is not None:
        filters.append(func.date(Alerta.fecha_hora) >= fecha_desde)

    if fecha_hasta is not None:
        filters.append(func.date(Alerta.fecha_hora) <= fecha_hasta)

    if placa is not None:
        filters.append(Vehiculo.placa.ilike(f"%{placa.strip()}%"))

    if operador_id is not None:
        filters.append(Alerta.operador_id == operador_id)

    if filters:
        statement = statement.where(*filters)
        count_statement = count_statement.where(*filters)

    total = session.scalar(count_statement) or 0

    records = session.execute(
        statement
        .order_by(Alerta.fecha_hora.desc(), Alerta.id.desc())
        .offset(offset)
        .limit(limit)
    ).mappings().all()

    return {
        "items": [dict(record) for record in records],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


# CONSULTA INDIVIDUAL
@database_operation
def get_alert(session: Session, alert_id: int) -> dict:
    """Consulta el detalle de una alerta."""

    find_alert(session, alert_id)
    return get_alert_data(session, alert_id)


# CORRECCIÓN DEL VEHÍCULO
@database_operation
def update_alert_vehicle(
    session: Session,
    alert_id: int,
    data: VehiculoAlertaActualizar,
) -> dict:
    """Actualiza los datos del vehículo asociado a una alerta pendiente."""

    alert = find_alert(session, alert_id)

    if alert.estado != "PENDIENTE":
        raise AlertaError(
            409,
            "Solo se pueden corregir vehículos de alertas pendientes.",
        )

    changes = data.model_dump(exclude_unset=True)

    if not changes:
        raise AlertaError(
            422,
            "Debes enviar al menos un dato para actualizar.",
        )

    vehicle = session.get(Vehiculo, alert.vehiculo_id)

    if vehicle is None:
        raise AlertaError(404, "Vehículo no encontrado.")

    for field, value in changes.items():
        setattr(vehicle, field, value)

    session.commit()

    return get_alert_data(session, alert_id)


# ATENCIÓN DE ALERTAS
@database_operation
def attend_alert(
    session: Session,
    alert_id: int,
    admin_user_id: int,
) -> dict:
    """Marca una alerta como atendida por el administrador autenticado."""

    alert = find_alert(session, alert_id)

    if alert.estado == "ATENDIDA":
        raise AlertaError(
            409,
            "Esta alerta ya fue atendida.",
        )

    admin = session.get(Usuario, admin_user_id)

    if admin is None or admin.rol != "ADMINISTRADOR":
        raise AlertaError(
            403,
            "Se requiere un usuario administrador para atender la alerta.",
        )

    alert.estado = "ATENDIDA"
    alert.atendida_por_usuario_id = admin.id
    alert.fecha_atencion = datetime.now(timezone.utc)

    session.commit()

    return get_alert_data(session, alert_id)
