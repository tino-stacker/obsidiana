-- =====================================================
-- OBS-STORE · OBSIDIANA JOYERÍA · SUPABASE SCHEMA v2
-- =====================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────
-- 1. PROVINCIAS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provincias (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  codigo        TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- 2. ZONAS DE REPARTO
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zonas (
  id                TEXT PRIMARY KEY,
  nombre            TEXT NOT NULL,
  provincia_id      TEXT REFERENCES provincias(id) ON DELETE CASCADE,
  tarifa_envio      NUMERIC(10,2) NOT NULL DEFAULT 0,
  dias_estimados    TEXT NOT NULL DEFAULT 'Mismo Día / 24 hrs',
  courier_asignado  TEXT NOT NULL DEFAULT 'Motorizado Obsidiana',
  estado            TEXT NOT NULL DEFAULT 'active' CHECK (estado IN ('active','inactive')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- 3. DISTRITOS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS distritos (
  id            TEXT PRIMARY KEY,
  provincia_id  TEXT REFERENCES provincias(id) ON DELETE CASCADE,
  zona_id       TEXT REFERENCES zonas(id) ON DELETE RESTRICT,
  nombre        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- 4. PRODUCTOS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku           TEXT UNIQUE,
  nombre        TEXT NOT NULL,
  categoria     TEXT NOT NULL,
  material      TEXT NOT NULL DEFAULT 'Plata 950',
  precio        NUMERIC(10,2) NOT NULL,
  stock         INTEGER NOT NULL DEFAULT 0,
  stock_minimo  INTEGER NOT NULL DEFAULT 5,
  ubicacion     TEXT DEFAULT 'Almacén Principal',
  descripcion   TEXT,
  imagen_url    TEXT,
  peso_gramos   NUMERIC(6,2),
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_stock     ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_sku       ON productos(sku);

-- ─────────────────────────────────────────────────────
-- 5. MOVIMIENTOS DE STOCK (KARDEX)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movimientos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_nombre TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('in','out','adjustment','alert')),
  cantidad        INTEGER NOT NULL,
  stock_anterior  INTEGER,
  stock_nuevo     INTEGER,
  motivo          TEXT NOT NULL,
  pedido_id       UUID,
  realizado_por   TEXT NOT NULL DEFAULT 'Sistema',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_producto ON stock_movimientos(producto_id);
CREATE INDEX IF NOT EXISTS idx_stock_tipo     ON stock_movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_stock_created  ON stock_movimientos(created_at DESC);

-- ─────────────────────────────────────────────────────
-- 6. CLIENTES
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT NOT NULL,
  doc_numero      TEXT,
  telefono        TEXT,
  email           TEXT,
  direccion       TEXT,
  referencia      TEXT,
  provincia       TEXT,
  distrito        TEXT,
  zona            TEXT,
  coords_lat      NUMERIC(10,7),
  coords_lng      NUMERIC(10,7),
  notas           TEXT,
  total_compras   NUMERIC(12,2) DEFAULT 0,
  num_pedidos     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_doc    ON clientes(doc_numero);
CREATE INDEX IF NOT EXISTS idx_clientes_email  ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

-- ─────────────────────────────────────────────────────
-- 7. PEDIDOS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido       TEXT UNIQUE NOT NULL,   -- PED-2026-0001
  numero_nota         TEXT UNIQUE,            -- NV-0001
  codigo_tracking     TEXT UNIQUE NOT NULL,   -- TRK-XXXXX / OBS-XXXXXX
  cliente_id          UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Snapshot cliente
  cliente_nombre      TEXT NOT NULL,
  cliente_doc         TEXT,
  cliente_email       TEXT,
  cliente_telefono    TEXT,
  cliente_direccion   TEXT,
  cliente_referencia  TEXT,
  cliente_provincia   TEXT,
  cliente_distrito    TEXT,
  cliente_zona        TEXT,
  cliente_notas       TEXT,
  cliente_lat         NUMERIC(10,7),
  cliente_lng         NUMERIC(10,7),

  -- Totales
  subtotal            NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento           NUMERIC(10,2) NOT NULL DEFAULT 0,
  tarifa_envio        NUMERIC(10,2) NOT NULL DEFAULT 0,
  total               NUMERIC(10,2) NOT NULL DEFAULT 0,
  adelanto            NUMERIC(10,2) NOT NULL DEFAULT 0,
  saldo               NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Envío
  tipo_entrega        TEXT NOT NULL DEFAULT 'express' CHECK (tipo_entrega IN ('express','provincia','tienda')),
  agencia_envio       TEXT,
  sede_shalom         TEXT,
  entrega_estimada    TEXT,

  -- Courier
  courier_nombre      TEXT,
  courier_telefono    TEXT,
  courier_vehiculo    TEXT,
  courier_placa       TEXT,

  -- Pago
  metodo_pago         TEXT NOT NULL DEFAULT 'Efectivo',
  notas               TEXT,

  -- Estado
  estado              TEXT NOT NULL DEFAULT 'pendiente' CHECK (
                        estado IN ('pendiente','en_preparacion','en_ruta','entregado','cancelado')
                      ),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_numero    ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_tracking  ON pedidos(codigo_tracking);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente   ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado    ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created   ON pedidos(created_at DESC);

-- ─────────────────────────────────────────────────────
-- 8. ITEMS DE PEDIDO
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id         UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id       UUID REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre   TEXT NOT NULL,
  sku               TEXT,
  material          TEXT,
  cantidad          INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario   NUMERIC(10,2) NOT NULL,
  total             NUMERIC(10,2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_pedido   ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_items_producto ON pedido_items(producto_id);

-- ─────────────────────────────────────────────────────
-- 9. TIMELINE / SEGUIMIENTO DEL PEDIDO
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_timeline (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id     UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado        TEXT NOT NULL,
  titulo        TEXT NOT NULL,
  descripcion   TEXT NOT NULL,
  ubicacion     TEXT NOT NULL DEFAULT '',
  completado    BOOLEAN NOT NULL DEFAULT FALSE,
  orden         INTEGER NOT NULL DEFAULT 1,
  timestamp     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_pedido ON pedido_timeline(pedido_id);

-- ─────────────────────────────────────────────────────
-- 10. CAJA / MOVIMIENTOS FINANCIEROS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caja_movimientos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo          TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  concepto      TEXT NOT NULL,
  monto         NUMERIC(10,2) NOT NULL,
  pedido_id     UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  metodo_pago   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caja_created ON caja_movimientos(created_at DESC);

-- ─────────────────────────────────────────────────────
-- 11. LOGS DE EMAIL
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id         UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  codigo_tracking   TEXT NOT NULL,
  email_destinatario TEXT NOT NULL,
  nombre_destinatario TEXT NOT NULL,
  asunto            TEXT NOT NULL,
  tipo_plantilla    TEXT NOT NULL CHECK (
                      tipo_plantilla IN (
                        'order_created','order_dispatched','out_for_delivery',
                        'delivered','low_stock_alert','manual'
                      )
                    ),
  cuerpo_html       TEXT NOT NULL,
  estado            TEXT NOT NULL DEFAULT 'sent' CHECK (estado IN ('sent','pending','failed')),
  enviado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tracking ON email_logs(codigo_tracking);
CREATE INDEX IF NOT EXISTS idx_email_enviado  ON email_logs(enviado_en DESC);

-- =====================================================
-- TRIGGERS: updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_productos
    BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_clientes
    BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_pedidos
    BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- TRIGGER: stock se descuenta al insertar item
-- =====================================================
CREATE OR REPLACE FUNCTION fn_descontar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.producto_id IS NOT NULL THEN
    INSERT INTO stock_movimientos
      (producto_id, producto_nombre, tipo, cantidad, stock_anterior, stock_nuevo, motivo, pedido_id)
    SELECT
      NEW.producto_id, NEW.producto_nombre,
      'out', NEW.cantidad,
      p.stock, p.stock - NEW.cantidad,
      'Venta en pedido ' || (SELECT numero_pedido FROM pedidos WHERE id = NEW.pedido_id),
      NEW.pedido_id
    FROM productos p WHERE p.id = NEW.producto_id;

    UPDATE productos SET stock = stock - NEW.cantidad WHERE id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER descontar_stock_en_venta
    AFTER INSERT ON pedido_items FOR EACH ROW
    EXECUTE FUNCTION fn_descontar_stock_venta();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- TRIGGER: estadísticas del cliente al crear pedido
-- =====================================================
CREATE OR REPLACE FUNCTION fn_actualizar_stats_cliente()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cliente_id IS NOT NULL THEN
    UPDATE clientes
    SET total_compras = total_compras + NEW.total,
        num_pedidos   = num_pedidos + 1,
        updated_at    = NOW()
    WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER actualizar_stats_cliente
    AFTER INSERT ON pedidos FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_stats_cliente();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- CLAVES FORÁNEAS FALTANTES
-- =====================================================
ALTER TABLE stock_movimientos 
  ADD CONSTRAINT fk_stock_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL;

-- =====================================================
-- RLS — Row Level Security
-- =====================================================
ALTER TABLE provincias        ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE distritos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_timeline   ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_movimientos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs        ENABLE ROW LEVEL SECURITY;

-- Acceso restringido a usuarios autenticados (para mayor seguridad)
CREATE POLICY "auth_all" ON provincias        FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON zonas             FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON distritos         FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON productos         FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON stock_movimientos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON clientes          FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON pedidos           FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON pedido_items      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON pedido_timeline   FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON caja_movimientos  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON email_logs        FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- DATOS INICIALES
-- =====================================================

INSERT INTO provincias (id, nombre, codigo) VALUES
  ('prov-lim', 'Lima',      'LIM'),
  ('prov-cus', 'Cusco',     'CUS'),
  ('prov-arq', 'Arequipa',  'AQP'),
  ('prov-piu', 'Piura',     'PIU'),
  ('prov-tru', 'Trujillo',  'TRU'),
  ('prov-chi', 'Chiclayo',  'CHI'),
  ('prov-iqu', 'Iquitos',   'IQU'),
  ('prov-pun', 'Puno',      'PUN'),
  ('prov-hua', 'Huancayo',  'HYO'),
  ('prov-caj', 'Cajamarca', 'CAJ'),
  ('prov-tac', 'Tacna',     'TAC'),
  ('prov-ica', 'Ica',       'ICA')
ON CONFLICT DO NOTHING;

INSERT INTO zonas (id, nombre, provincia_id, tarifa_envio, dias_estimados, courier_asignado) VALUES
  ('zone-lim-express',  'Lima Express',       'prov-lim', 10.00, 'Mismo Día / 24 hrs',  'Motorizado Obsidiana'),
  ('zone-prov-shalom',  'Provincias Shalom',  NULL,       18.00, '2 a 5 días hábiles',  'Shalom Express'),
  ('zone-tienda',       'Recojo en Tienda',   'prov-lim',  0.00, 'En el momento',       'Tienda Obsidiana')
ON CONFLICT DO NOTHING;

INSERT INTO distritos (id, provincia_id, zona_id, nombre) VALUES
  ('dist-miraflores', 'prov-lim', 'zone-lim-express', 'Miraflores'),
  ('dist-san-isidro',  'prov-lim', 'zone-lim-express', 'San Isidro'),
  ('dist-lince',       'prov-lim', 'zone-lim-express', 'Lince'),
  ('dist-surco',       'prov-lim', 'zone-lim-express', 'Surco'),
  ('dist-la-victoria', 'prov-lim', 'zone-lim-express', 'La Victoria'),
  ('dist-wanchaq',     'prov-cus', 'zone-prov-shalom', 'Wanchaq'),
  ('dist-cusco-ctr',   'prov-cus', 'zone-prov-shalom', 'Cusco Centro'),
  ('dist-arq-centro',  'prov-arq', 'zone-prov-shalom', 'Arequipa Centro'),
  ('dist-piu-centro',  'prov-piu', 'zone-prov-shalom', 'Piura Centro'),
  ('dist-tru-centro',  'prov-tru', 'zone-prov-shalom', 'Trujillo Centro')
ON CONFLICT DO NOTHING;

INSERT INTO productos (sku, nombre, categoria, material, precio, stock, stock_minimo, descripcion, activo) VALUES
  ('OBS-ARE-001', 'Conchita', 'Aretes', 'Plata 925', 59.00, 10, 5, '', true),
  ('OBS-ARE-002', 'Esfera', 'Aretes', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ARE-003', 'Corazón Liso', 'Aretes', 'Plata 925', 39.00, 10, 5, '', true),
  ('OBS-ARE-004', 'Flor Rosa', 'Aretes', 'Plata 925', 39.00, 10, 5, '', true),
  ('OBS-ARE-005', 'Corazón Rosa', 'Aretes', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ARE-006', 'Corazón Circón', 'Aretes', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ARE-007', 'Corazón Perla', 'Aretes', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ARE-008', 'Flor Perla', 'Aretes', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ARE-009', 'Estrella de Mar', 'Aretes', 'Plata 925', 59.00, 10, 5, '', true),
  ('OBS-ARE-010', 'Pastilla', 'Aretes', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ARE-011', 'Triqueta', 'Aretes', 'Plata 925', 59.00, 10, 5, '', true),
  ('OBS-ARE-012', 'Brillantes', 'Aretes', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ARE-013', 'Huella', 'Aretes', 'Plata 925', 59.00, 10, 5, '', true),
  ('OBS-ARE-014', 'Búho', 'Aretes', 'Plata 925', 59.00, 10, 5, '', true),
  ('OBS-ARE-015', 'Argolla Entrochada', 'Aretes', 'Plata 925', 69.00, 10, 5, '', true),
  ('OBS-ARE-016', 'Argolla Lisa', 'Aretes', 'Plata 925', 69.00, 10, 5, '', true),
  ('OBS-ARE-017', 'Rombos', 'Aretes', 'Plata 925', 59.00, 0, 5, '', true),
  ('OBS-CON-018', 'Conjunto Aros', 'Conjuntos', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-CON-019', 'Conjunto Perla Circón', 'Conjuntos', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-CON-020', 'Conjunto Corazón Verde', 'Conjuntos', 'Plata 925', 99.00, 10, 5, '', true),
  ('OBS-CON-021', 'Conjunto Mandala', 'Conjuntos', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-022', 'Nudo de Bruja', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-023', 'Flor de Loto', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-024', 'Girasol', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-025', 'Flor Andina', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-026', 'Corazón Amazonita', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-027', 'Obsidiana', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-028', 'Amatista', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-029', 'Flor Cosmos', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-030', 'Trebol', 'Collares', 'Plata 925', 89.00, 10, 5, '', true),
  ('OBS-COL-031', 'Corazón Diamantado', 'Collares', 'Plata 925', 79.00, 10, 5, '', true),
  ('OBS-COL-032', 'Estrella de Mar', 'Collares', 'Plata 925', 79.00, 10, 5, '', true),
  ('OBS-COL-033', 'Estrella Lisa', 'Collares', 'Plata 925', 79.00, 10, 5, '', true),
  ('OBS-COL-034', 'Cruz Andina', 'Collares', 'Plata 925', 79.00, 10, 5, '', true),
  ('OBS-COL-035', 'Hoja Arce', 'Collares', 'Plata 925', 79.00, 10, 5, '', true),
  ('OBS-COL-036', 'Collar Satelital', 'Collares', 'Plata 925', 65.00, 10, 5, '', true),
  ('OBS-PUL-037', 'Corazón Rojo', 'Pulseras', 'Plata 925', 59.00, 10, 5, '', true),
  ('OBS-PUL-038', 'Trebol Brillante', 'Pulseras', 'Plata 925', 59.00, 10, 5, '', true),
  ('OBS-PUL-039', 'Tres Lazos', 'Pulseras', 'Plata 925', 55.00, 10, 5, '', true),
  ('OBS-PUL-040', 'Corazones', 'Pulseras', 'Plata 925', 55.00, 10, 5, '', true),
  ('OBS-PUL-041', 'Eslabones Finos', 'Pulseras', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-PUL-042', 'Eclipse', 'Pulseras', 'Plata 925', 55.00, 10, 5, '', true),
  ('OBS-ANI-043', 'Margarita', 'Anillos', 'Plata 925', 49.00, 10, 5, '', true),
  ('OBS-ANI-044', 'Eslabones', 'Anillos', 'Plata 925', 39.00, 10, 5, '', true),
  ('OBS-ANI-045', 'Órbita', 'Anillos', 'Plata 925', 39.00, 10, 5, '', true),
  ('OBS-ANI-046', 'Infinito', 'Anillos', 'Plata 925', 39.00, 10, 5, '', true),
  ('OBS-ANI-047', 'Corazón Circón', 'Anillos', 'Plata 925', 39.00, 10, 5, 'Colores: Rojo, Blanco, Morado, Rosa', true)
ON CONFLICT (sku) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  precio = EXCLUDED.precio,
  stock = EXCLUDED.stock,
  activo = EXCLUDED.activo;
