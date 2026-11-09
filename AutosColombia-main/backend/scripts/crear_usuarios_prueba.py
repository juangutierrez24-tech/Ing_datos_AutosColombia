
"""Crea las cuentas de prueba de Autos Colombia.

Uso desde backend/:
    python -m scripts.crear_usuarios_prueba

El script puede ejecutarse varias veces sin duplicar las cuentas.
No muestra contraseñas ni hashes.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_engine
from app.models import Operador, Usuario
from app.schemas.operador import OperadorCrear
from app.schemas.usuario import UsuarioCrear
from app.services.operador import create_operator
from app.services.usuario import create_user


CUENTAS_PRUEBA = [
    {
        "username": "admin",
        "password": "AdminAutos2026!",
        "rol": "ADMINISTRADOR",
        "nombre": "Administrador de prueba",
        "telefono": "3000000001",
    },
    {
        "username": "operador1",
        "password": "OperadorAutos2026!",
        "rol": "OPERADOR",
        "nombre": "Operador de prueba 1",
        "telefono": "3000000002",
    },
]


def buscar_usuario(session: Session, username: str):
    """Busca una cuenta por su username."""
    return session.scalar(
        select(Usuario).where(Usuario.username == username)
    )


def buscar_operador(
    session: Session,
    nombre: str,
    telefono: str,
):
    """Busca un operador por su nombre y teléfono."""

    operadores = session.scalars(
        select(Operador).where(
            Operador.nombre == nombre,
            Operador.telefono == telefono,
        )
    ).all()

    if len(operadores) > 1:
        raise RuntimeError(
            "Se encontraron varios operadores con los mismos datos. "
            "Revisa la base de datos antes de continuar."
        )

    return operadores[0] if operadores else None


def verificar_usuario_existente(
    session: Session,
    usuario: Usuario,
    cuenta: dict,
):
    """Comprueba que una cuenta existente corresponda a la esperada."""

    operador = session.get(Operador, usuario.operador_id)

    if operador is None:
        raise RuntimeError(
            f"La cuenta {cuenta['username']} tiene un operador inexistente."
        )

    if usuario.rol != cuenta["rol"]:
        raise RuntimeError(
            f"La cuenta {cuenta['username']} ya existe con otro rol."
        )

    if (
        operador.nombre != cuenta["nombre"]
        or operador.telefono != cuenta["telefono"]
    ):
        raise RuntimeError(
            f"La cuenta {cuenta['username']} está asociada "
            "a un operador diferente."
        )

    print(
        f"[EXISTENTE] ID={usuario.id} | "
        f"Username={usuario.username} | Rol={usuario.rol}"
    )


def crear_cuenta(session: Session, cuenta: dict):
    """Crea una cuenta o reutiliza sus registros si ya existen."""

    username = cuenta["username"]

    # 1. Comprobar si el usuario ya existe.
    usuario = buscar_usuario(session, username)

    if usuario is not None:
        verificar_usuario_existente(session, usuario, cuenta)
        return usuario

    # 2. Buscar si el operador ya existe.
    # Esto permite recuperar una ejecución parcial.
    operador = buscar_operador(
        session,
        cuenta["nombre"],
        cuenta["telefono"],
    )

    if operador is None:
        # 3. Crear el operador usando el servicio existente.
        operador = create_operator(
            session,
            OperadorCrear(
                nombre=cuenta["nombre"],
                telefono=cuenta["telefono"],
            ),
        )

        print(
            f"[OPERADOR CREADO] ID={operador.id} | "
            f"Nombre={operador.nombre}"
        )
    else:
        print(
            f"[OPERADOR EXISTENTE] ID={operador.id} | "
            f"Nombre={operador.nombre}"
        )

    # 4. Comprobar que el operador no tenga otra cuenta.
    usuario_asociado = session.scalar(
        select(Usuario).where(
            Usuario.operador_id == operador.id
        )
    )

    if usuario_asociado is not None:
        raise RuntimeError(
            f"El operador {operador.id} ya tiene una cuenta "
            f"({usuario_asociado.username}). No se modificará."
        )

    # 5. Crear el usuario mediante el servicio existente.
    usuario = create_user(
        session,
        UsuarioCrear(
            operador_id=operador.id,
            username=username,
            password=cuenta["password"],
            rol=cuenta["rol"],
        ),
    )

    print(
        f"[USUARIO CREADO] ID={usuario.id} | "
        f"Username={usuario.username} | Rol={usuario.rol}"
    )

    return usuario


def main():
    """Punto de entrada del script."""

    print("=" * 55)
    print("AUTOS COLOMBIA - CREACIÓN DE CUENTAS DE PRUEBA")
    print("=" * 55)

    try:
        with Session(get_engine()) as session:
            for cuenta in CUENTAS_PRUEBA:
                print(f"\nProcesando cuenta: {cuenta['username']}")

                crear_cuenta(session, cuenta)

        print("\n" + "=" * 55)
        print("PROCESO FINALIZADO")
        print("=" * 55)

    except Exception as error:
        # No imprimir el mensaje de excepción: podría contener
        # datos de entrada sensibles en ciertos errores.
        print("\nERROR: No fue posible completar el proceso.")
        print(f"Tipo de error: {type(error).__name__}")
        print(
            "Revisa la base de datos y vuelve a ejecutar el script. "
            "Las cuentas ya creadas no se duplicarán."
        )
        raise SystemExit(1) from None


if __name__ == "__main__":
    main()
