import re
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from functools import wraps

from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, selectinload


from app.models import Celda, Estancia, Operador, Vehiculo, required_text
from app.schemas.celda import CeldaRespuesta
from app.schemas.estancia import (
    EntradaCrear, SalidaCrear, EstanciaRespuesta, EstanciaAbiertaRespuesta,
    EstadoVehiculoRespuesta,
)
from app.schemas.vehiculo import VehiculoRespuesta


class EstanciaError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def transaccion(operation):
    """Una transacción por solicitud; materializa la respuesta antes del commit."""
    @wraps(operation)
    def wrapped(self, *args, **kwargs):
        try:
            with self.session.begin():
                return operation(self, *args, **kwargs)
        except IntegrityError as error:
            self.session.rollback()
            code = getattr(error.orig, "sqlstate", None)
            constraint = getattr(getattr(error.orig, "diag", None), "constraint_name", None)
            if code == "23505":
                if constraint == "uq_estancia_vehiculo_abierta":
                    raise EstanciaError(409, "El vehículo ya está dentro.") from None
                if constraint == "uq_estancia_celda_abierta":
                    raise EstanciaError(409, "La celda está ocupada.") from None
            if code == "23503":
                raise EstanciaError(404, "Una de las referencias ya no existe. Actualiza los datos.") from None
            if code in {"23502", "23514"}:
                raise EstanciaError(422, "Los datos incumplen las restricciones de la estancia.") from None
            raise EstanciaError(409, "La operación entra en conflicto con los datos existentes.") from None
        except SQLAlchemyError:
            self.session.rollback()
            raise EstanciaError(503, "No se pudo completar la operación con la base de datos.") from None
    return wrapped


class ServicioEstancia:
    def __init__(self, session: Session) -> None:
        self.session = session

    def _vehiculo(self, placa: str) -> Vehiculo:
        vehiculo = self.session.scalar(select(Vehiculo).where(Vehiculo.placa == placa))
        if vehiculo is None:
            raise EstanciaError(404, "Vehículo no encontrado.")
        return vehiculo

    def _operador(self, operador_id: int) -> Operador:
        operador = self.session.get(Operador, operador_id)
        if operador is None:
            raise EstanciaError(404, "Operador no encontrado.")
        return operador

    @transaccion
    def entrada(self, data: EntradaCrear) -> EstanciaRespuesta:
        vehiculo = self._vehiculo(data.placa)
        celda = self.session.get(Celda, data.celda_id)
        if celda is None:
            raise EstanciaError(404, "Celda no encontrada.")
        operador = self._operador(data.operador_id)
        if self.session.scalar(select(Estancia.id).where(
            Estancia.vehiculo_id == vehiculo.id, Estancia.salida.is_(None)
        )) is not None:
            raise EstanciaError(409, "El vehículo ya está dentro.")
        if self.session.scalar(select(Estancia.id).where(
            Estancia.celda_id == celda.id, Estancia.salida.is_(None)
        )) is not None:
            raise EstanciaError(409, "La celda está ocupada.")
        estancia = Estancia(vehiculo_id=vehiculo.id, celda_id=celda.id,
                            operador_entrada_id=operador.id, entrada=datetime.now(timezone.utc))
        self.session.add(estancia)
        # Los índices únicos deciden también cuando dos solicitudes superan las consultas previas.
        self.session.flush()
        return EstanciaRespuesta.model_validate(estancia)

    @transaccion
    def historial(
        self,
        placa: str | None = None,
        desde: datetime | None = None,
        hasta: datetime | None = None,
        estado: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> dict:
        filtros = []

        if placa:
            placa = placa.strip().upper()

            if not re.fullmatch(r"[A-Z]{3}[0-9]{3}", placa):
                raise EstanciaError(
                    422,
                    "La placa debe tener exactamente 3 letras seguidas de 3 números."
                )

            filtros.append(
                Estancia.vehiculo.has(Vehiculo.placa == placa)
            )

        if desde:
            filtros.append(Estancia.entrada >= desde)

        if hasta:
            filtros.append(Estancia.entrada <= hasta)

        if estado == "abierta":
            filtros.append(Estancia.salida.is_(None))
        elif estado == "cerrada":
            filtros.append(Estancia.salida.is_not(None))
        elif estado not in (None, "todos"):
            raise EstanciaError(422, "El estado indicado no es válido.")

        consulta = (
            select(Estancia)
            .options(
                selectinload(Estancia.vehiculo),
                selectinload(Estancia.celda),
                selectinload(Estancia.operador_entrada),
                selectinload(Estancia.operador_salida),
            )
            .where(*filtros)
        )

        total = self.session.scalar(
            select(func.count())
            .select_from(Estancia)
            .where(*filtros)
        ) or 0

        items = list(
            self.session.scalars(
                consulta
                .order_by(Estancia.entrada.desc(), Estancia.id.desc())
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

    @transaccion
    def salida(self, data: SalidaCrear) -> EstanciaRespuesta:
        vehiculo = self._vehiculo(data.placa)
        operador = self._operador(data.operador_id)
        # PostgreSQL vuelve a evaluar salida IS NULL tras esperar el bloqueo.
        estancia = self.session.scalar(select(Estancia).where(
            Estancia.vehiculo_id == vehiculo.id, Estancia.salida.is_(None)
        ).with_for_update())
        if estancia is None:
            raise EstanciaError(409, "El vehículo no tiene una estancia abierta.")
        try:
            estancia.cerrar(datetime.now(timezone.utc), operador)
        except ValueError:
            raise EstanciaError(409, "No se puede cerrar la estancia con su estado o fecha actuales.") from None
        self.session.flush()
        return EstanciaRespuesta.model_validate(estancia)

    @transaccion
    def consultar(self, placa: str) -> EstadoVehiculoRespuesta:
        placa = required_text(placa, "placa").upper()
        # Una sola consulta da un estado consistente de vehículo, estancia y celda.
        if not re.fullmatch(r"[A-Z]{3}[0-9]{3}", placa):
            raise EstanciaError(422, "La placa debe tener exactamente 3 letras " "seguidas de 3 números (ejemplo: ABC123).") from None
        row = self.session.execute(select(Vehiculo, Estancia, Celda).outerjoin(
            Estancia, and_(Estancia.vehiculo_id == Vehiculo.id, Estancia.salida.is_(None))
        ).outerjoin(Celda, Celda.id == Estancia.celda_id).where(Vehiculo.placa == placa)).one_or_none()
        if row is None:
            raise EstanciaError(404, "Vehículo no encontrado.")
        vehiculo, estancia, celda = row
        abierta = None
        if estancia is not None:
            abierta = EstanciaAbiertaRespuesta(
                **EstanciaRespuesta.model_validate(estancia).model_dump(),
                celda=CeldaRespuesta.model_validate(celda),
            )
        return EstadoVehiculoRespuesta(vehiculo=VehiculoRespuesta.model_validate(vehiculo),
                                       esta_dentro=estancia is not None, estancia=abierta)
    
    @transaccion
    def resumen(self) -> dict:
        # El día operativo se calcula según la hora de Colombia.
        zona = ZoneInfo("America/Bogota")
        ahora = datetime.now(zona)

        inicio_local = ahora.replace(
            hour=0,     minute=0, second=0, microsecond=0
        )

        inicio_dia = inicio_local.astimezone(timezone.utc)
        fin_dia = (inicio_local + timedelta(days=1)).astimezone(timezone.utc)

        vehiculos_dentro = self.session.scalar(
            select(func.count())
            .select_from(Estancia)
            .where(Estancia.salida.is_(None))
        ) or 0

        celdas_ocupadas = self.session.scalar(
            select(func.count(func.distinct(Estancia.celda_id)))
            .where(Estancia.salida.is_(None))
        ) or 0

        total_celdas = self.session.scalar(
            select(func.count()).select_from(Celda)
        ) or 0

        entradas_hoy = self.session.scalar(
            select(func.count())
            .select_from(Estancia)
            .where(
                Estancia.entrada >= inicio_dia,
                Estancia.entrada < fin_dia,
            )
        ) or 0

        salidas_hoy = self.session.scalar(
            select(func.count())
            .select_from(Estancia)
            .where(
                Estancia.salida >= inicio_dia,
                Estancia.salida < fin_dia,
            )
        ) or 0

        ultimas = self.session.scalars(
            select(Estancia)
            .options(
                selectinload(Estancia.vehiculo),
                selectinload(Estancia.celda),
            )
            .order_by(Estancia.entrada.desc(), Estancia.id.desc())
            .limit(5)
        ).all()

        ultimas_estancias = [
            {
                "id": estancia.id,
                "placa": estancia.vehiculo.placa,
                "vehiculo": (
                    f"{estancia.vehiculo.marca} "
                    f"{estancia.vehiculo.modelo} · "
                    f"{estancia.vehiculo.color}"
                ),
                "celda": estancia.celda.codigo,
                "hora_entrada": estancia.entrada.astimezone(zona).strftime("%H:%M"),
                "estado": "Dentro" if estancia.salida is None else "Finalizada",
            }
            for estancia in ultimas
        ]

        return {
            "vehiculos_dentro": vehiculos_dentro,
            "celdas_ocupadas": celdas_ocupadas,
            "celdas_disponibles": max(0, total_celdas - celdas_ocupadas),
            "entradas_hoy": entradas_hoy,
            "salidas_hoy": salidas_hoy,
            "ultimas_estancias": ultimas_estancias,
        }
