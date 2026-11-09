"""Configuración privada desde backend/.env y variables de entorno."""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import dotenv_values

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class ConfigurationError(ValueError):
    """Error que contiene únicamente nombres de variables, nunca sus valores."""


@dataclass(frozen=True)
class DatabaseSettings:
    host: str
    port: int
    name: str = field(repr=False)
    user: str = field(repr=False)
    password: str = field(repr=False)
    connect_timeout: int = 5

@dataclass(frozen=True)
class AuthSettings:
    secret_key: str = field(repr=False)
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"


def load_database_settings() -> DatabaseSettings:
    # No interpolar $ ni ${...} dentro de las contraseñas.
    values = {**dotenv_values(ENV_FILE, encoding="utf-8-sig", interpolate=False), **os.environ}
    required = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_CONNECT_TIMEOUT")
    missing = [
        key for key in required
        if not (values.get(key) or "").strip()
        or (values.get(key) or "").startswith("CAMBIAR_")
    ]
    if missing:
        raise ConfigurationError("Completa en backend/.env: " + ", ".join(missing))

    def positive_integer(key: str, maximum: int) -> int:
        try:
            number = int(values[key])
        except (ValueError, TypeError):
            raise ConfigurationError(f"{key} debe ser un entero válido.") from None
        if not 1 <= number <= maximum:
            raise ConfigurationError(f"{key} debe estar entre 1 y {maximum}.")
        return number

    return DatabaseSettings(
        host=values["DB_HOST"],
        port=positive_integer("DB_PORT", 65535),
        name=values["DB_NAME"],
        user=values["DB_USER"],
        password=values["DB_PASSWORD"],
        connect_timeout=positive_integer("DB_CONNECT_TIMEOUT", 60),
    )


def load_auth_settings() -> AuthSettings:
    values = {
        **dotenv_values(ENV_FILE, encoding="utf-8-sig", interpolate=False),
        **os.environ,
    }

    secret_key = (values.get("JWT_SECRET_KEY") or "").strip()

    if not secret_key or secret_key.startswith("CAMBIAR_"):
        raise ConfigurationError(
            "Completa en backend/.env: JWT_SECRET_KEY"
        )

    if len(secret_key) < 32:
        raise ConfigurationError(
            "JWT_SECRET_KEY debe tener al menos 32 caracteres."
        )

    try:
        expire_minutes = int(
            values.get("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 30)
        )
    except (ValueError, TypeError):
        raise ConfigurationError(
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES debe ser un entero válido."
        ) from None

    if not 1 <= expire_minutes <= 1440:
        raise ConfigurationError(
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES debe estar entre 1 y 1440."
        )

    return AuthSettings(
        secret_key=secret_key,
        access_token_expire_minutes=expire_minutes,
    )