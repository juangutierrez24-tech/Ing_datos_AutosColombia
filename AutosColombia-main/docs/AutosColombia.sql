


-- 1. TABLA VEHICULO
CREATE TABLE vehiculo (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    placa TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo INTEGER NOT NULL,
    color TEXT NOT NULL,
    tipo TEXT NOT NULL,

    CONSTRAINT pk_vehiculo
        PRIMARY KEY (id),

    CONSTRAINT uq_vehiculo_placa
        UNIQUE (placa),

    CONSTRAINT ck_vehiculo_placa_no_vacia
        CHECK (placa ~ '[^[:space:]]'),

    CONSTRAINT ck_vehiculo_placa_normalizada
        CHECK (
            placa = upper(
                regexp_replace(
                    placa,
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                )
            )
        ),

    CONSTRAINT ck_vehiculo_formato_placa
        CHECK (placa ~ '^[A-Z]{3}[0-9]{3}$'),

    CONSTRAINT ck_vehiculo_marca_no_vacia
        CHECK (marca ~ '[^[:space:]]'),

    CONSTRAINT ck_vehiculo_color_no_vacio
        CHECK (color ~ '[^[:space:]]'),

    CONSTRAINT ck_vehiculo_modelo_anio
        CHECK (modelo BETWEEN 1 AND 9999),

    CONSTRAINT ck_vehiculo_tipo
        CHECK (tipo IN ('MOTO', 'AUTOMOVIL', 'CAMIONETA'))
);


-- 2. TABLA CELDA
CREATE TABLE celda (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    codigo TEXT NOT NULL,
    tipo TEXT NOT NULL,

    CONSTRAINT pk_celda
        PRIMARY KEY (id),

    CONSTRAINT uq_celda_codigo
        UNIQUE (codigo),

    CONSTRAINT ck_celda_codigo_no_vacio
        CHECK (codigo ~ '[^[:space:]]'),

    CONSTRAINT ck_celda_codigo_normalizado
        CHECK (
            codigo = upper(
                regexp_replace(
                    codigo,
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                )
            )
        ),

    CONSTRAINT ck_celda_tipo_no_vacio
        CHECK (tipo ~ '[^[:space:]]')
);


-- 3. TABLA OPERADOR
CREATE TABLE operador (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,

    CONSTRAINT pk_operador
        PRIMARY KEY (id),

    CONSTRAINT ck_operador_nombre_no_vacio
        CHECK (nombre ~ '[^[:space:]]'),

    CONSTRAINT ck_operador_telefono_no_vacio
        CHECK (telefono ~ '[^[:space:]]')
);


-- 4. TABLA ESTANCIA
CREATE TABLE estancia (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    vehiculo_id BIGINT NOT NULL,
    celda_id BIGINT NOT NULL,
    entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
    salida TIMESTAMPTZ NULL,
    operador_entrada_id BIGINT NOT NULL,
    operador_salida_id BIGINT NULL,

    CONSTRAINT pk_estancia
        PRIMARY KEY (id),

    CONSTRAINT fk_estancia_vehiculo
        FOREIGN KEY (vehiculo_id)
        REFERENCES vehiculo (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_estancia_celda
        FOREIGN KEY (celda_id)
        REFERENCES celda (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_estancia_operador_entrada
        FOREIGN KEY (operador_entrada_id)
        REFERENCES operador (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_estancia_operador_salida
        FOREIGN KEY (operador_salida_id)
        REFERENCES operador (id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_estancia_orden_fechas
        CHECK (salida >= entrada),

    CONSTRAINT ck_estancia_cierre_completo
        CHECK (
            (salida IS NULL) = (operador_salida_id IS NULL)
        )
);


-- 5. INDICES PARA LAS ESTANCIAS ABIERTAS Y EL HISTORIAL

-- Un vehículo no puede tener dos estancias abiertas.
CREATE UNIQUE INDEX uq_estancia_vehiculo_abierta
    ON estancia (vehiculo_id)
    WHERE salida IS NULL;

-- Una celda no puede tener dos estancias abiertas.
CREATE UNIQUE INDEX uq_estancia_celda_abierta
    ON estancia (celda_id)
    WHERE salida IS NULL;

-- Facilita consultar el historial de un vehículo.
CREATE INDEX ix_estancia_vehiculo_entrada
    ON estancia (vehiculo_id, entrada);

-- 6. TABLA USUARIO

CREATE TABLE usuario (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    operador_id BIGINT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL,

    CONSTRAINT pk_usuario
        PRIMARY KEY (id),

    CONSTRAINT uq_usuario_operador
        UNIQUE (operador_id),

    CONSTRAINT uq_usuario_username
        UNIQUE (username),

    CONSTRAINT fk_usuario_operador
        FOREIGN KEY (operador_id)
        REFERENCES operador (id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_usuario_username_no_vacio
        CHECK (username ~ '[^[:space:]]'),

    CONSTRAINT ck_usuario_username_normalizado
        CHECK (
            username = lower(
                regexp_replace(
                    username,
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                )
            )
        ),

    CONSTRAINT ck_usuario_password_hash_no_vacio
        CHECK (password_hash ~ '[^[:space:]]'),

    CONSTRAINT ck_usuario_rol
        CHECK (rol IN ('ADMINISTRADOR', 'OPERADOR'))
);


-- 7. TABLA REGISTRO_LOGIN

CREATE TABLE registro_login (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    usuario_id BIGINT NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_registro_login
        PRIMARY KEY (id),

    CONSTRAINT fk_registro_login_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario (id)
        ON DELETE RESTRICT
);


-- Facilita consultar rápidamente los últimos inicios de sesión.
CREATE INDEX ix_registro_login_usuario_fecha
    ON registro_login (usuario_id, fecha_hora DESC);


CREATE INDEX ix_registro_login_fecha
    ON registro_login (fecha_hora DESC);


-- 8. TABLA ALERTA

CREATE TABLE alerta (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    vehiculo_id BIGINT NOT NULL,
    operador_id BIGINT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado TEXT NOT NULL DEFAULT 'PENDIENTE',
    atendida_por_usuario_id BIGINT NULL,
    fecha_atencion TIMESTAMPTZ NULL,

    CONSTRAINT pk_alerta
        PRIMARY KEY (id),

    CONSTRAINT fk_alerta_vehiculo
        FOREIGN KEY (vehiculo_id)
        REFERENCES vehiculo (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_alerta_operador
        FOREIGN KEY (operador_id)
        REFERENCES operador (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_alerta_atendida_por_usuario
        FOREIGN KEY (atendida_por_usuario_id)
        REFERENCES usuario (id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_alerta_descripcion_no_vacia
        CHECK (descripcion ~ '[^[:space:]]'),

    CONSTRAINT ck_alerta_estado
        CHECK (estado IN ('PENDIENTE', 'ATENDIDA')),

    CONSTRAINT ck_alerta_atencion_completa
        CHECK (
            (estado = 'PENDIENTE'
                AND atendida_por_usuario_id IS NULL
                AND fecha_atencion IS NULL)
            OR
            (estado = 'ATENDIDA'
                AND atendida_por_usuario_id IS NOT NULL
                AND fecha_atencion IS NOT NULL)
        )
);


-- Facilita consultar las alertas pendientes.
CREATE INDEX ix_alerta_estado_fecha
    ON alerta (estado, fecha_hora DESC);


-- Facilita consultar las alertas de un vehículo.
CREATE INDEX ix_alerta_vehiculo_fecha
    ON alerta (vehiculo_id, fecha_hora DESC);


-- Facilita consultar las alertas reportadas por un operador.
CREATE INDEX ix_alerta_operador_fecha
    ON alerta (operador_id, fecha_hora DESC);


INSERT INTO vehiculo (placa, color, modelo, marca, tipo)
VALUES ('ABC123', 'Gris', 2022, 'Renault', 'AUTOMOVIL');

INSERT INTO celda (codigo, tipo)
VALUES ('A-01', 'AUTOMOVIL');



