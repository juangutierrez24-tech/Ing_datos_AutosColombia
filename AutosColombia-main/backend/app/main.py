
"""Punto de entrada de la API de Autos Colombia."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.database import get_engine

# Routers
from app.routers.vehiculos import router as vehiculos_router
from app.routers.celdas import router as celdas_router
from app.routers.operadores import router as operadores_router
from app.routers.estancias import router as estancias_router
from app.routers.auth import router as auth_router
from app.routers.usuarios import router as usuarios_router
from app.routers.registro_login import router as registro_login_router
from app.routers.alertas import router as alertas_router

# Excepciones de los servicios
from app.services.vehiculo import VehiculoError
from app.services.celda import CeldaError
from app.services.operador import OperadorError
from app.services.estancia import EstanciaError
from app.services.auth import AuthError
from app.services.usuario import UsuarioError
from app.services.registro_login import RegistroLoginError
from app.services.alerta import AlertaError


app = FastAPI(title="Autos Colombia API")


# REGISTRO DE ROUTERS

app.include_router(vehiculos_router)
app.include_router(celdas_router)
app.include_router(operadores_router)
app.include_router(estancias_router)
app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(registro_login_router)
app.include_router(alertas_router)


# MANEJO CENTRALIZADO DE EXCEPCIONES

@app.exception_handler(VehiculoError)
@app.exception_handler(CeldaError)
@app.exception_handler(OperadorError)
@app.exception_handler(EstanciaError)
@app.exception_handler(AuthError)
@app.exception_handler(UsuarioError)
@app.exception_handler(RegistroLoginError)
@app.exception_handler(AlertaError)
async def entity_error_handler(
    request: Request,
    error: (
        VehiculoError
        | CeldaError
        | OperadorError
        | EstanciaError
        | AuthError
        | UsuarioError
        | RegistroLoginError
        | AlertaError
    ),
) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={"detail": error.detail},
    )


# COMPROBACIÓN DE CONEXIÓN

@app.get("/health")
def health():
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "disconnected",
            },
        )
