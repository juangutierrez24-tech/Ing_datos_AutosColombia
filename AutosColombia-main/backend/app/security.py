
"""Funciones de seguridad para autenticación y autorización."""

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.config import load_auth_settings


# ------------------------------------------------------------
# CONFIGURACIÓN
# ------------------------------------------------------------

password_hasher = PasswordHash.recommended()


# ------------------------------------------------------------
# CONTRASEÑAS
# ------------------------------------------------------------

def hash_password(password: str) -> str:
    """Genera un hash seguro de una contraseña utilizando Argon2."""

    if not isinstance(password, str) or not password:
        raise ValueError("La contraseña no puede estar vacía.")

    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verifica una contraseña contra su hash almacenado."""

    if not isinstance(password, str) or not isinstance(password_hash, str):
        return False

    if not password or not password_hash:
        return False

    try:
        return password_hasher.verify(password, password_hash)
    except (ValueError, TypeError):
        return False


# ------------------------------------------------------------
# GENERACIÓN DE TOKENS JWT
# ------------------------------------------------------------

def create_access_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Genera un token JWT firmado para identificar al usuario."""

    if not isinstance(subject, str) or not subject.strip():
        raise ValueError("El identificador del usuario no es válido.")

    settings = load_auth_settings()

    now = datetime.now(timezone.utc)

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(
            minutes=settings.access_token_expire_minutes
        ),
    }

    if extra_claims:
        reserved_claims = {"sub", "iat", "exp"}

        if reserved_claims.intersection(extra_claims):
            raise ValueError(
                "No se pueden sobrescribir las propiedades "
                "reservadas del token."
            )

        payload.update(extra_claims)

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm,
    )


# ------------------------------------------------------------
# VALIDACIÓN DE TOKENS JWT
# ------------------------------------------------------------

def decode_access_token(token: str) -> dict[str, Any] | None:
    """Valida un JWT y devuelve su contenido si es válido."""

    if not isinstance(token, str) or not token.strip():
        return None

    settings = load_auth_settings()

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={
                "require": ["sub", "iat", "exp"],
            },
        )

        subject = payload.get("sub")

        if not isinstance(subject, str) or not subject.strip():
            return None

        return payload

    except InvalidTokenError:
        return None
