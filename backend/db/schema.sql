-- EnFormaFit App — Base de datos completa
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CLIENTES ─────────────────────────────────────────────────────────────────
CREATE TABLE clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT,
  tipo            TEXT NOT NULL CHECK (tipo IN ('programa', '1a1')),
  fecha_nacimiento DATE,
  peso_inicial    NUMERIC(5,2),
  altura          NUMERIC(5,1),
  objetivo        TEXT CHECK (objetivo IN ('def', 'sup', 'mant')),
  actividad       NUMERIC(4,3) DEFAULT 1.375,
  comidas         INT DEFAULT 3,
  dias_entreno    INT DEFAULT 3,
  lugar           TEXT DEFAULT 'gym',
  tiempo_ent      INT DEFAULT 45,
  nivel           INT DEFAULT 1 CHECK (nivel IN (0,1,2)),
  lesiones        TEXT,
  excluir_alimentos TEXT[],
  kcal_asignadas  INT,
  rutina_actual   TEXT,
  semanas_bloque  INT DEFAULT 10,
  semanas_revision INT[] DEFAULT '{4,9}',
  estado          TEXT DEFAULT 'activo' CHECK (estado IN ('activo','baja','pausado')),
  stripe_customer_id TEXT,
  fecha_alta      TIMESTAMP DEFAULT NOW(),
  fecha_inicio    DATE,
  rgpd_aceptado   TIMESTAMP,
  notas           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── BLOQUES ───────────────────────────────────────────────────────────────────
CREATE TABLE bloques (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  numero_bloque   INT NOT NULL DEFAULT 1,
  rutina_cod      TEXT NOT NULL,
  kcal_inicio     INT,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE,
  semanas         INT DEFAULT 10,
  estado          TEXT DEFAULT 'activo' CHECK (estado IN ('activo','completado','cancelado')),
  aprobado_por    TEXT DEFAULT 'entrenador',
  aprobado_at     TIMESTAMP,
  visible_cliente BOOLEAN DEFAULT FALSE,
  notas_entrenador TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── HISTORIAL DE CAMBIOS DE PLAN ─────────────────────────────────────────────
CREATE TABLE cambios_plan (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  bloque_id       UUID REFERENCES bloques(id),
  tipo_cambio     TEXT NOT NULL,
  valor_anterior  TEXT,
  valor_nuevo     TEXT,
  motivo          TEXT,
  realizado_en    TIMESTAMP DEFAULT NOW()
);

-- ── RUTINAS ───────────────────────────────────────────────────────────────────
CREATE TABLE rutinas (
  cod             TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  dias            INT NOT NULL,
  lugar           TEXT NOT NULL,
  nivel           INT NOT NULL CHECK (nivel IN (0,1,2)),
  tiempo_min      INT DEFAULT 45,
  ejercicios      JSONB NOT NULL,
  activa          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Cascada de progresión de rutinas
CREATE TABLE cascada_rutinas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rutina_origen   TEXT NOT NULL REFERENCES rutinas(cod),
  rutina_siguiente TEXT NOT NULL REFERENCES rutinas(cod),
  condicion_dias  INT,
  condicion_lugar TEXT,
  condicion_nivel_min INT,
  prioridad       INT DEFAULT 1
);

-- ── EJERCICIOS ────────────────────────────────────────────────────────────────
CREATE TABLE ejercicios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT UNIQUE NOT NULL,
  grupo           TEXT,
  series          TEXT,
  reps            TEXT,
  rir             TEXT,
  aclaraciones    TEXT,
  url_video       TEXT,
  activo          BOOLEAN DEFAULT TRUE
);

-- ── ALIMENTOS ─────────────────────────────────────────────────────────────────
CREATE TABLE alimentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT UNIQUE NOT NULL,
  kcal_100g       NUMERIC(6,2),
  proteina_100g   NUMERIC(5,2),
  carbos_100g     NUMERIC(5,2),
  grasas_100g     NUMERIC(5,2),
  grupo           TEXT,
  activo          BOOLEAN DEFAULT TRUE
);

-- ── PLANES DE NUTRICIÓN ───────────────────────────────────────────────────────
CREATE TABLE planes_nutricion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bloque_id       UUID NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  kcal_total      INT NOT NULL,
  proteina_g      INT,
  carbos_g        INT,
  grasas_g        INT,
  distribucion    JSONB,
  comidas         JSONB,
  pdf_url         TEXT,
  version         INT DEFAULT 1,
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── MENÚ SEMANAL (solo 1:1) ───────────────────────────────────────────────────
CREATE TABLE menus_semanales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  semana_inicio   DATE NOT NULL,
  configuracion   JSONB NOT NULL,
  lista_compra    JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── REVISIONES ────────────────────────────────────────────────────────────────
CREATE TABLE revisiones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bloque_id       UUID NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  cliente_id      UUID NOT NULL REFERENCES clientes(id),
  semana          INT NOT NULL,
  peso            NUMERIC(5,2),
  medidas         JSONB,
  fotos_urls      TEXT[],
  preguntas       JSONB,
  feedback_entrenador TEXT,
  estado          TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','subida','revisada')),
  fecha_subida    TIMESTAMP,
  fecha_revision  TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── REGISTRO DE ENTRENAMIENTO ─────────────────────────────────────────────────
CREATE TABLE registro_entreno (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bloque_id       UUID NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  cliente_id      UUID NOT NULL REFERENCES clientes(id),
  semana          INT NOT NULL,
  dia             TEXT NOT NULL,
  ejercicio       TEXT NOT NULL,
  serie           INT NOT NULL,
  kg              NUMERIC(6,2),
  reps_reales     INT,
  rir_real        INT,
  completada      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── PESO DIARIO ───────────────────────────────────────────────────────────────
CREATE TABLE peso_diario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  peso            NUMERIC(5,2) NOT NULL,
  UNIQUE(cliente_id, fecha)
);

-- ── CHECK-INS SEMANALES (1:1) ─────────────────────────────────────────────────
CREATE TABLE checkins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  semana_inicio   DATE NOT NULL,
  dias_entreno_real INT,
  dias_nutricion  INT,
  dias_pasos      INT,
  orgullos        TEXT[],
  compromisos     TEXT,
  sensaciones     TEXT,
  leido_entrenador BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── NOTIFICACIONES ────────────────────────────────────────────────────────────
CREATE TABLE notificaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  titulo          TEXT NOT NULL,
  mensaje         TEXT NOT NULL,
  enviar_en       TIMESTAMP NOT NULL,
  enviada         BOOLEAN DEFAULT FALSE,
  enviada_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_bloques_cliente ON bloques(cliente_id);
CREATE INDEX idx_revisiones_bloque ON revisiones(bloque_id);
CREATE INDEX idx_registro_bloque ON registro_entreno(bloque_id);
CREATE INDEX idx_checkins_cliente ON checkins(cliente_id);
CREATE INDEX idx_notificaciones_pendientes ON notificaciones(enviada, enviar_en);
CREATE INDEX idx_peso_cliente_fecha ON peso_diario(cliente_id, fecha);

-- ── FUNCIÓN AUTO-UPDATE ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
