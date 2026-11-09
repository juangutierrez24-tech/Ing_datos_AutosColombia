
"""Modelos de datos del sistema Autos Colombia.

Importar este módulo no crea tablas ni abre conexiones.
"""
import re
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    validates,
)


class Base(DeclarativeBase):
    pass


def required_text(value: str, attribute: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{attribute} debe ser texto no vacío.")
    return value.strip()


# VEHICULOS

class Vehiculo(Base):
    __tablename__ = "vehiculo"
    __table_args__ = (
        UniqueConstraint("placa", name="uq_vehiculo_placa"),
        CheckConstraint(
            "placa ~ '[^[:space:]]'",
            name="ck_vehiculo_placa_no_vacia",
        ),
        CheckConstraint(
            "placa = upper(regexp_replace(placa, "
            "'^[[:space:]]+|[[:space:]]+$', '', 'g'))",
            name="ck_vehiculo_placa_normalizada",
        ),
        CheckConstraint(
            "placa ~ '^[A-Z]{3}[0-9]{3}$'",
            name="ck_vehiculo_formato_placa",
        ),
        CheckConstraint(
            "color ~ '[^[:space:]]'",
            name="ck_vehiculo_color_no_vacio",
        ),
        CheckConstraint(
            "marca ~ '[^[:space:]]'",
            name="ck_vehiculo_marca_no_vacia",
        ),
        CheckConstraint(
            "modelo BETWEEN 1 AND 9999",
            name="ck_vehiculo_modelo_anio",
        ),
        CheckConstraint(
            "tipo IN ('MOTO', 'AUTOMOVIL', 'CAMIONETA')",
            name="ck_vehiculo_tipo",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), primary_key=True
    )
    placa: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str] = mapped_column(Text, nullable=False)
    modelo: Mapped[int] = mapped_column(Integer, nullable=False)
    marca: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(Text, nullable=False)

    @validates("placa", "color", "marca", "tipo")
    def validate_text(self, key: str, value: str) -> str:
        value = required_text(value, key)

        if key == "placa":
            value = value.upper()
            if not re.fullmatch(r"[A-Z]{3}[0-9]{3}", value):
                raise ValueError(
                    "La placa debe tener exactamente 3 letras "
                    "seguidas de 3 números (ejemplo: ABC123)."
                )
            return value

        if key == "tipo" and value not in {
            "MOTO", "AUTOMOVIL", "CAMIONETA"
        }:
            raise ValueError(
                "tipo debe ser MOTO, AUTOMOVIL o CAMIONETA."
            )

        return value

    @validates("modelo")
    def validate_modelo(self, key: str, value: int) -> int:
        if type(value) is not int or not 1 <= value <= 9999:
            raise ValueError(
                "modelo debe ser un año entero entre 1 y 9999."
            )
        return value


# CELDAS

class Celda(Base):
    __tablename__ = "celda"
    __table_args__ = (
        UniqueConstraint("codigo", name="uq_celda_codigo"),
        CheckConstraint(
            "codigo ~ '[^[:space:]]'",
            name="ck_celda_codigo_no_vacio",
        ),
        CheckConstraint(
            "codigo = upper(regexp_replace(codigo, "
            "'^[[:space:]]+|[[:space:]]+$', '', 'g'))",
            name="ck_celda_codigo_normalizado",
        ),
        CheckConstraint(
            "tipo ~ '[^[:space:]]'",
            name="ck_celda_tipo_no_vacio",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), primary_key=True
    )
    codigo: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(Text, nullable=False)

    @validates("codigo", "tipo")
    def validate_text(self, key: str, value: str) -> str:
        value = required_text(value, key)
        return value.upper() if key == "codigo" else value


# OPERADORES

class Operador(Base):
    __tablename__ = "operador"
    __table_args__ = (
        CheckConstraint(
            "nombre ~ '[^[:space:]]'",
            name="ck_operador_nombre_no_vacio",
        ),
        CheckConstraint(
            "telefono ~ '[^[:space:]]'",
            name="ck_operador_telefono_no_vacio",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), primary_key=True
    )
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    telefono: Mapped[str] = mapped_column(Text, nullable=False)

    # Relación uno a uno: un operador puede tener una cuenta de usuario.
    usuario: Mapped["Usuario | None"] = relationship(
        back_populates="operador",
        uselist=False,
    )

    @validates("nombre", "telefono")
    def validate_text(self, key: str, value: str) -> str:
        return required_text(value, key)


# ESTANCIAS

class Estancia(Base):
    __tablename__ = "estancia"
    __table_args__ = (
        CheckConstraint(
            "salida >= entrada",
            name="ck_estancia_orden_fechas",
        ),
        CheckConstraint(
            "(salida IS NULL) = (operador_salida_id IS NULL)",
            name="ck_estancia_cierre_completo",
        ),
        Index(
            "uq_estancia_vehiculo_abierta",
            "vehiculo_id",
            unique=True,
            postgresql_where=text("salida IS NULL"),
        ),
        Index(
            "uq_estancia_celda_abierta",
            "celda_id",
            unique=True,
            postgresql_where=text("salida IS NULL"),
        ),
        Index(
            "ix_estancia_vehiculo_entrada",
            "vehiculo_id",
            "entrada",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), primary_key=True
    )
    vehiculo_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "vehiculo.id",
            name="fk_estancia_vehiculo",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    celda_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "celda.id",
            name="fk_estancia_celda",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    entrada: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    salida: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    operador_entrada_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "operador.id",
            name="fk_estancia_operador_entrada",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    operador_salida_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "operador.id",
            name="fk_estancia_operador_salida",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    vehiculo: Mapped[Vehiculo] = relationship()
    celda: Mapped[Celda] = relationship()
    operador_entrada: Mapped[Operador] = relationship(
        foreign_keys=[operador_entrada_id]
    )
    operador_salida: Mapped[Operador | None] = relationship(
        foreign_keys=[operador_salida_id]
    )

    def esta_abierta(self) -> bool:
        return self.salida is None

    def cerrar(
        self,
        fecha_salida: datetime,
        operador: Operador,
    ) -> None:
        """Valida y asigna el cierre de una estancia."""
        if not self.esta_abierta():
            raise ValueError("La estancia ya está cerrada.")

        if (
            not isinstance(fecha_salida, datetime)
            or fecha_salida.utcoffset() is None
        ):
            raise ValueError(
                "La fecha de salida debe tener zona horaria."
            )

        if (
            not isinstance(self.entrada, datetime)
            or self.entrada.utcoffset() is None
        ):
            raise ValueError(
                "La entrada debe estar cargada y tener zona horaria "
                "antes de cerrar."
            )

        if (
            fecha_salida.astimezone(timezone.utc)
            < self.entrada.astimezone(timezone.utc)
        ):
            raise ValueError(
                "La salida no puede ser anterior a la entrada."
            )

        if not isinstance(operador, Operador) or operador.id is None:
            raise ValueError(
                "El operador de salida debe tener un id asignado."
            )

        self.salida = fecha_salida
        self.operador_salida = operador
        self.operador_salida_id = operador.id

# USUARIOS

class Usuario(Base):
    __tablename__ = "usuario"
    __table_args__ = (
        UniqueConstraint(
            "operador_id",
            name="uq_usuario_operador",
        ),
        UniqueConstraint(
            "username",
            name="uq_usuario_username",
        ),
        CheckConstraint(
            "username ~ '[^[:space:]]'",
            name="ck_usuario_username_no_vacio",
        ),
        CheckConstraint(
            "username = lower(regexp_replace(username, "
            "'^[[:space:]]+|[[:space:]]+$', '', 'g'))",
            name="ck_usuario_username_normalizado",
        ),
        CheckConstraint(
            "password_hash ~ '[^[:space:]]'",
            name="ck_usuario_password_hash_no_vacio",
        ),
        CheckConstraint(
            "rol IN ('ADMINISTRADOR', 'OPERADOR')",
            name="ck_usuario_rol",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), primary_key=True
    )

    operador_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "operador.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    username: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    rol: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    operador: Mapped[Operador] = relationship(
        back_populates="usuario",
    )

    registros_login: Mapped[list["RegistroLogin"]] = relationship(
        back_populates="usuario",
    )

    alertas_atendidas: Mapped[list["Alerta"]] = relationship(
        back_populates="atendida_por_usuario",
        foreign_keys="Alerta.atendida_por_usuario_id",
    )

    @validates("username")
    def validate_username(self, key: str, value: str) -> str:
        return required_text(value, key).lower()

    @validates("password_hash")
    def validate_password_hash(self, key: str, value: str) -> str:
        return required_text(value, key)

    @validates("rol")
    def validate_rol(self, key: str, value: str) -> str:
        value = required_text(value, key)

        if value not in {"ADMINISTRADOR", "OPERADOR"}:
            raise ValueError(
                "El rol debe ser ADMINISTRADOR u OPERADOR."
            )

        return value


# REGISTROS DE INICIO DE SESION

class RegistroLogin(Base):
    __tablename__ = "registro_login"
    __table_args__ = (
        Index(
            "ix_registro_login_usuario_fecha",
            "usuario_id",
            text("fecha_hora DESC"),
        ),
        Index(
            "ix_registro_login_fecha",
            text("fecha_hora DESC"),
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), primary_key=True
    )

    usuario_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "usuario.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    fecha_hora: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    usuario: Mapped[Usuario] = relationship(
        back_populates="registros_login",
    )


# ============================================================
# ALERTAS
# ============================================================

class Alerta(Base):
    __tablename__ = "alerta"
    __table_args__ = (
        CheckConstraint(
            "descripcion ~ '[^[:space:]]'",
            name="ck_alerta_descripcion_no_vacia",
        ),
        CheckConstraint(
            "estado IN ('PENDIENTE', 'ATENDIDA')",
            name="ck_alerta_estado",
        ),
        CheckConstraint(
            "("
            "estado = 'PENDIENTE' "
            "AND atendida_por_usuario_id IS NULL "
            "AND fecha_atencion IS NULL"
            ") OR ("
            "estado = 'ATENDIDA' "
            "AND atendida_por_usuario_id IS NOT NULL "
            "AND fecha_atencion IS NOT NULL"
            ")",
            name="ck_alerta_atencion_completa",
        ),
        Index(
            "ix_alerta_estado_fecha",
            "estado",
            text("fecha_hora DESC"),
        ),
        Index(
            "ix_alerta_vehiculo_fecha",
            "vehiculo_id",
            text("fecha_hora DESC"),
        ),
        Index(
            "ix_alerta_operador_fecha",
            "operador_id",
            text("fecha_hora DESC"),
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), primary_key=True
    )

    vehiculo_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "vehiculo.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    operador_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "operador.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    descripcion: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    fecha_hora: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    estado: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("'PENDIENTE'"),
    )

    atendida_por_usuario_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "usuario.id",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    fecha_atencion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    vehiculo: Mapped[Vehiculo] = relationship()
    operador: Mapped[Operador] = relationship()

    atendida_por_usuario: Mapped[Usuario | None] = relationship(
        back_populates="alertas_atendidas",
        foreign_keys=[atendida_por_usuario_id],
    )

    @validates("descripcion")
    def validate_descripcion(self, key: str, value: str) -> str:
        return required_text(value, key)

    @validates("estado")
    def validate_estado(self, key: str, value: str) -> str:
        value = required_text(value, key)

        if value not in {"PENDIENTE", "ATENDIDA"}:
            raise ValueError(
                "El estado debe ser PENDIENTE o ATENDIDA."
            )

        return value
