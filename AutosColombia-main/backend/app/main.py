from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.database import get_engine

from app.routers.vehiculos import router as vehiculos_router
from app.services.vehiculo import VehiculoError
from app.routers.celdas import router as celdas_router
from app.services.celda import CeldaError
from app.routers.operadores import router as operadores_router
from app.services.operador import OperadorError
from app.routers.estancias import router as estancias_router
from app.services.estancia import EstanciaError

app = FastAPI(title="Autos Colombia API")
app.include_router(vehiculos_router)
app.include_router(celdas_router)
app.include_router(operadores_router)
app.include_router(estancias_router)


@app.exception_handler(VehiculoError)
@app.exception_handler(CeldaError)
@app.exception_handler(OperadorError)
@app.exception_handler(EstanciaError)
async def entity_error_handler(request, error: VehiculoError | CeldaError | OperadorError | EstanciaError) -> JSONResponse:
    return JSONResponse(status_code=error.status_code, content={"detail": error.detail})


@app.get("/health")
def health():
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected"
        }

    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "disconnected"
            }
        )
