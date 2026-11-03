from datetime import date, datetime, time, timezone
from typing import Annotated, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_session
from app.schemas.estancia import (
    EntradaCrear,
    SalidaCrear,
    EstanciaRespuesta,
    EstadoVehiculoRespuesta,
    EstanciasPagina,
)
from app.schemas.vehiculo import Placa
from app.services.estancia import ServicioEstancia

router = APIRouter(prefix="/estancias", tags=["Estancias"])
DatabaseSession = Annotated[Session, Depends(get_session)]


@router.post("/entrada", response_model=EstanciaRespuesta, status_code=201)
def entrada(data: EntradaCrear, session: DatabaseSession) -> EstanciaRespuesta:
    return ServicioEstancia(session).entrada(data)


@router.post("/salida", response_model=EstanciaRespuesta)
def salida(data: SalidaCrear, session: DatabaseSession) -> EstanciaRespuesta:
    return ServicioEstancia(session).salida(data)


@router.get("/vehiculo/{placa}", response_model=EstadoVehiculoRespuesta)
def consultar(placa: Placa, session: DatabaseSession) -> EstadoVehiculoRespuesta:
    return ServicioEstancia(session).consultar(placa)


@router.get("/resumen")
def resumen(session: DatabaseSession) -> dict:
    return ServicioEstancia(session).resumen()


@router.get("/historial", response_model=EstanciasPagina)
def historial(
    session: DatabaseSession,
    placa: str | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    estado: Literal["todos", "abierta", "cerrada"] = "todos",
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> EstanciasPagina:

    zona = ZoneInfo("America/Bogota")

    desde_utc = (
        datetime.combine(desde, time.min, tzinfo=zona).astimezone(timezone.utc)
        if desde else None
    )

    hasta_utc = (
        datetime.combine(hasta, time.max, tzinfo=zona).astimezone(timezone.utc)
        if hasta else None
    )

    if desde and hasta and desde > hasta:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="La fecha inicial no puede ser posterior a la fecha final.",
        )

    return ServicioEstancia(session).historial(
        placa=placa,
        desde=desde_utc,
        hasta=hasta_utc,
        estado=estado,
        offset=offset,
        limit=limit,
    )
