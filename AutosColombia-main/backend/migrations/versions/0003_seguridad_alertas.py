
"""Crea usuarios, registros de login y alertas.

Revision ID: 0003
Revises: 0002
"""

from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --------------------------------------------------------
    # USUARIO
    # --------------------------------------------------------
    op.create_table(
        "usuario",
        sa.Column(
            "id",
            sa.BigInteger(),
            sa.Identity(always=True),
            primary_key=True,
        ),
        sa.Column("operador_id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("rol", sa.Text(), nullable=False),

        sa.ForeignKeyConstraint(
            ["operador_id"],
            ["operador.id"],
            ondelete="RESTRICT",
        ),

        sa.UniqueConstraint(
            "operador_id",
            name="uq_usuario_operador",
        ),
        sa.UniqueConstraint(
            "username",
            name="uq_usuario_username",
        ),

        sa.CheckConstraint(
            "username ~ '[^[:space:]]'",
            name="ck_usuario_username_no_vacio",
        ),
        sa.CheckConstraint(
            "username = lower(regexp_replace(username, "
            "'^[[:space:]]+|[[:space:]]+$', '', 'g'))",
            name="ck_usuario_username_normalizado",
        ),
        sa.CheckConstraint(
            "password_hash ~ '[^[:space:]]'",
            name="ck_usuario_password_hash_no_vacio",
        ),
        sa.CheckConstraint(
            "rol IN ('ADMINISTRADOR', 'OPERADOR')",
            name="ck_usuario_rol",
        ),
    )

    # --------------------------------------------------------
    # REGISTRO_LOGIN
    # --------------------------------------------------------
    op.create_table(
        "registro_login",
        sa.Column(
            "id",
            sa.BigInteger(),
            sa.Identity(always=True),
            primary_key=True,
        ),
        sa.Column("usuario_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "fecha_hora",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuario.id"],
            ondelete="RESTRICT",
        ),
    )

    op.create_index(
        "ix_registro_login_usuario_fecha",
        "registro_login",
        ["usuario_id", sa.text("fecha_hora DESC")],
    )

    op.create_index(
        "ix_registro_login_fecha",
        "registro_login",
        [sa.text("fecha_hora DESC")],
    )

    # --------------------------------------------------------
    # ALERTA
    # --------------------------------------------------------
    op.create_table(
        "alerta",
        sa.Column(
            "id",
            sa.BigInteger(),
            sa.Identity(always=True),
            primary_key=True,
        ),
        sa.Column("vehiculo_id", sa.BigInteger(), nullable=False),
        sa.Column("operador_id", sa.BigInteger(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column(
            "fecha_hora",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "estado",
            sa.Text(),
            server_default=sa.text("'PENDIENTE'"),
            nullable=False,
        ),
        sa.Column(
            "atendida_por_usuario_id",
            sa.BigInteger(),
            nullable=True,
        ),
        sa.Column(
            "fecha_atencion",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.ForeignKeyConstraint(
            ["vehiculo_id"],
            ["vehiculo.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["operador_id"],
            ["operador.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["atendida_por_usuario_id"],
            ["usuario.id"],
            ondelete="RESTRICT",
        ),

        sa.CheckConstraint(
            "descripcion ~ '[^[:space:]]'",
            name="ck_alerta_descripcion_no_vacia",
        ),
        sa.CheckConstraint(
            "estado IN ('PENDIENTE', 'ATENDIDA')",
            name="ck_alerta_estado",
        ),
        sa.CheckConstraint(
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
    )

    op.create_index(
        "ix_alerta_estado_fecha",
        "alerta",
        ["estado", sa.text("fecha_hora DESC")],
    )

    op.create_index(
        "ix_alerta_vehiculo_fecha",
        "alerta",
        ["vehiculo_id", sa.text("fecha_hora DESC")],
    )

    op.create_index(
        "ix_alerta_operador_fecha",
        "alerta",
        ["operador_id", sa.text("fecha_hora DESC")],
    )


def downgrade() -> None:
    # Atención: esta reversión elimina los registros de estas tablas.
    op.drop_index(
        "ix_alerta_operador_fecha",
        table_name="alerta",
    )
    op.drop_index(
        "ix_alerta_vehiculo_fecha",
        table_name="alerta",
    )
    op.drop_index(
        "ix_alerta_estado_fecha",
        table_name="alerta",
    )
    op.drop_table("alerta")

    op.drop_index(
        "ix_registro_login_fecha",
        table_name="registro_login",
    )
    op.drop_index(
        "ix_registro_login_usuario_fecha",
        table_name="registro_login",
    )
    op.drop_table("registro_login")

    op.drop_table("usuario")
