-- =============================================================================
--  OBSIDIANA STORE — INSTALACIÓN COMPLETA PARA SUPABASE
--  Proyecto Supabase: https://odjofatvoxrpiebwgwqj.supabase.co
--
--  INSTRUCCIONES PARA SUPABASE:
--  1. Abre tu panel de Supabase:
--     https://supabase.com/dashboard/project/odjofatvoxrpiebwgwqj/sql/new
--  2. Pega TODO el contenido de este archivo en el SQL Editor.
--  3. Haz clic en "RUN".
--
--  ESTE SCRIPT INCLUYE:
--  - Tablas completas, tipos ENUM, triggers transaccionales de stock y vistas
--  - Roles jerárquicos OWNER (100) y ADMIN (50) con catálogo de permisos
--  - Usuarios iniciales (con contraseñas encriptadas en bcrypt):
--      * OWNER: valentino@obsidiana.com (clave: 30092023)
--      * ADMIN: ruben@obsidiana.com     (clave: 3009202620)
--  - Políticas RLS y Grants para anon y authenticated
--  - Catálogo inicial: 47 productos de Joyería y Plata 950/925, 5 provincias,
--    6 zonas con tarifas, 15 distritos, 387 agencias Shalom/Olva y pedidos demo.
-- =============================================================================



-- =============================================================================
--  OBSIDIANA STORE — ESQUEMA DE BASE DE DATOS (PostgreSQL 14+ / Supabase)
--  Archivo 1 de 3: estructura, funciones, triggers, vistas y seguridad.
--
--  Orden de ejecución:
--    1) 01_schema.sql          (este archivo)
--    2) 02_seed_security.sql   (roles, permisos y usuarios OWNER / ADMIN)
--    3) 03_seed_data.sql       (catálogo: provincias, zonas, productos, etc.)
--
--  Es re-ejecutable: usa IF NOT EXISTS / CREATE OR REPLACE y no borra datos.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONES
--    pgcrypto -> gen_random_uuid(), crypt(), gen_salt() (hash bcrypt de claves)
--    En Supabase ya viene instalada en el esquema "extensions".
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- -----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pendiente', 'en_preparacion', 'en_ruta', 'entregado', 'cancelado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
    CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_template_type') THEN
    CREATE TYPE email_template_type AS ENUM (
      'order_created', 'order_dispatched', 'out_for_delivery', 'delivered', 'low_stock_alert'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
    CREATE TYPE email_status AS ENUM ('sent', 'pending', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN
    CREATE TYPE record_status AS ENUM ('active', 'inactive');
  END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- 2. FUNCIÓN GENÉRICA updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- 3. SEGURIDAD: ROLES, PERMISOS, USUARIOS, SESIONES, AUDITORÍA
-- =============================================================================

-- Roles jerárquicos: a mayor "level", mayor autoridad.
--   OWNER = 100 (acceso total)
--   ADMIN =  50 (acceso operativo, por debajo del OWNER)
CREATE TABLE IF NOT EXISTS roles (
  code         text        PRIMARY KEY CHECK (code = upper(code)),
  name         text        NOT NULL,
  description  text,
  level        smallint    NOT NULL UNIQUE CHECK (level BETWEEN 1 AND 100),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Catálogo de permisos por módulo (coinciden con las pestañas del Sidebar).
CREATE TABLE IF NOT EXISTS permissions (
  code         text        PRIMARY KEY,            -- ej: 'inventory.adjust'
  module       text        NOT NULL,               -- pos | orders | inventory | shipping | tracking | reports | emails | users | system
  description  text        NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code        text NOT NULL REFERENCES roles(code)       ON UPDATE CASCADE ON DELETE CASCADE,
  permission_code  text NOT NULL REFERENCES permissions(code) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE IF NOT EXISTS users (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL UNIQUE
                                CHECK (email = lower(btrim(email)) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name         text        NOT NULL,
  password_hash     text        NOT NULL,          -- bcrypt (crypt + gen_salt('bf'))
  role_code         text        NOT NULL REFERENCES roles(code) ON UPDATE CASCADE,
  is_active         boolean     NOT NULL DEFAULT true,
  failed_attempts   smallint    NOT NULL DEFAULT 0,
  locked_until      timestamptz,
  last_login_at     timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_by        uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_code);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Sesiones de login (se guarda solo el HASH del token, nunca el token).
CREATE TABLE IF NOT EXISTS user_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   text        NOT NULL UNIQUE,
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT now() + interval '12 hours',
  revoked_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

-- Bitácora de auditoría de acciones sensibles.
CREATE TABLE IF NOT EXISTS audit_log (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  action       text        NOT NULL,              -- ej: 'user.create', 'stock.adjust', 'order.status'
  entity       text,                              -- ej: 'products'
  entity_id    text,
  details      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);


-- =============================================================================
-- 4. GEOGRAFÍA Y ZONAS DE ENVÍO
-- =============================================================================
CREATE TABLE IF NOT EXISTS provinces (
  id          text        PRIMARY KEY DEFAULT ('prov-' || gen_random_uuid()),
  name        text        NOT NULL UNIQUE,
  code        text        NOT NULL UNIQUE CHECK (code = upper(code)),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zones (
  id                text           PRIMARY KEY DEFAULT ('zone-' || gen_random_uuid()),
  name              text           NOT NULL,
  province_id       text           NOT NULL REFERENCES provinces(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  shipping_fee      numeric(10,2)  NOT NULL DEFAULT 15.00 CHECK (shipping_fee >= 0),
  estimated_days    text           NOT NULL DEFAULT '24 - 48 hrs',
  courier_assigned  text           NOT NULL DEFAULT 'Courier Local',
  status            record_status  NOT NULL DEFAULT 'active',
  created_at        timestamptz    NOT NULL DEFAULT now(),
  updated_at        timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (province_id, name)
);

CREATE INDEX IF NOT EXISTS idx_zones_province ON zones(province_id);

DROP TRIGGER IF EXISTS trg_zones_updated_at ON zones;
CREATE TRIGGER trg_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS districts (
  id           text        PRIMARY KEY DEFAULT ('dist-' || gen_random_uuid()),
  province_id  text        NOT NULL REFERENCES provinces(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  zone_id      text        NOT NULL REFERENCES zones(id)     ON UPDATE CASCADE ON DELETE RESTRICT,
  name         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (province_id, name)
);

CREATE INDEX IF NOT EXISTS idx_districts_zone ON districts(zone_id);

-- Agencias de courier (Shalom / Olva) para envíos a provincia.
CREATE TABLE IF NOT EXISTS shipping_agencies (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company     text        NOT NULL CHECK (company IN ('Shalom', 'Olva')),
  department  text        NOT NULL,
  city        text        NOT NULL,
  district    text        NOT NULL,
  address     text        NOT NULL,
  phone       text,
  hours       text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company, department, city, district, address)
);

CREATE INDEX IF NOT EXISTS idx_agencies_lookup ON shipping_agencies(company, department, district);


-- =============================================================================
-- 5. INVENTARIO
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  name        text        PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          text           PRIMARY KEY DEFAULT ('prod-' || gen_random_uuid()),
  sku         text           NOT NULL UNIQUE,
  name        text           NOT NULL,
  category    text           NOT NULL DEFAULT 'General'
                             REFERENCES categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  price       numeric(10,2)  NOT NULL CHECK (price >= 0),
  stock       integer        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock   integer        NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  location    text           NOT NULL DEFAULT 'Almacén Principal',
  is_active   boolean        NOT NULL DEFAULT true,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock) WHERE stock <= min_stock;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS stock_movements (
  id            text                PRIMARY KEY DEFAULT ('mov-' || gen_random_uuid()),
  product_id    text                NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  product_name  text                NOT NULL,          -- snapshot del nombre al momento del movimiento
  type          stock_movement_type NOT NULL,
  quantity      integer             NOT NULL CHECK (quantity >= 0),
  stock_before  integer,
  stock_after   integer,
  reason        text                NOT NULL,
  performed_by  text                NOT NULL,          -- nombre visible (ej: 'Sistema de Pedidos')
  user_id       uuid                REFERENCES users(id) ON DELETE SET NULL,
  order_id      text,                                  -- FK agregada más abajo (orders se crea después)
  created_at    timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id, created_at DESC);


-- =============================================================================
-- 6. PEDIDOS
-- =============================================================================

-- Numeración de pedidos: PED-AAAA-0093, PED-AAAA-0094, ...
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 93;

CREATE OR REPLACE FUNCTION fn_next_order_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'PED-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
$$;

-- Código de tracking único: TRK-12345
CREATE OR REPLACE FUNCTION fn_generate_tracking_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
BEGIN
  LOOP
    v_code := 'TRK-' || (10000 + floor(random() * 90000))::int;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE tracking_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE TABLE IF NOT EXISTS orders (
  id                  text           PRIMARY KEY DEFAULT ('ord-' || gen_random_uuid()),
  order_number        text           NOT NULL UNIQUE DEFAULT fn_next_order_number(),
  tracking_code       text           NOT NULL UNIQUE DEFAULT fn_generate_tracking_code(),

  -- Datos del cliente (snapshot al momento de la compra)
  customer_name       text           NOT NULL,
  customer_email      text           NOT NULL,
  customer_phone      text           NOT NULL,
  customer_doc        text,                                -- DNI / RUC
  customer_address    text           NOT NULL,
  customer_reference  text,
  customer_province   text           NOT NULL,
  customer_district   text           NOT NULL,
  customer_zone       text,
  customer_notes      text,
  customer_lat        numeric(9,6)   CHECK (customer_lat BETWEEN -90 AND 90),
  customer_lng        numeric(9,6)   CHECK (customer_lng BETWEEN -180 AND 180),

  -- Importes
  subtotal            numeric(10,2)  NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_fee        numeric(10,2)  NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount            numeric(10,2)  NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total               numeric(10,2)  NOT NULL DEFAULT 0 CHECK (total >= 0),

  status              order_status   NOT NULL DEFAULT 'pendiente',
  payment_method      text           NOT NULL DEFAULT 'Transferencia / Yape',
  estimated_delivery  text           NOT NULL DEFAULT 'En 24 a 48 Horas',

  -- Courier asignado
  courier_driver_name   text,
  courier_driver_phone  text,
  courier_vehicle       text,
  courier_license_plate text,

  created_by          uuid           REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email      ON orders(lower(customer_email));

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- FK diferida de stock_movements -> orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_movements_order') THEN
    ALTER TABLE stock_movements
      ADD CONSTRAINT fk_movements_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS order_items (
  id            bigint         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      text           NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id    text           NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  product_name  text           NOT NULL,       -- snapshot
  sku           text           NOT NULL,       -- snapshot
  material      text,                          -- ej: 'Plata 950'
  quantity      integer        NOT NULL CHECK (quantity > 0),
  unit_price    numeric(10,2)  NOT NULL CHECK (unit_price >= 0),
  total         numeric(10,2)  GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Línea de tiempo del tracking
CREATE TABLE IF NOT EXISTS order_timeline (
  id           bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id     text         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  step_order   smallint     NOT NULL,
  status       text         NOT NULL,
  title        text         NOT NULL,
  description  text         NOT NULL DEFAULT '',
  location     text         NOT NULL DEFAULT '',
  completed    boolean      NOT NULL DEFAULT false,
  occurred_at  timestamptz,                    -- NULL mientras no se complete
  UNIQUE (order_id, step_order)
);

-- Nota de venta (comprobante del POS), 1 a 1 con el pedido.
CREATE TABLE IF NOT EXISTS sale_receipts (
  order_id        text           PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  receipt_number  text           NOT NULL UNIQUE,
  issued_at       timestamptz    NOT NULL DEFAULT now(),
  subtotal        numeric(10,2)  NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_fee    numeric(10,2)  NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount        numeric(10,2)  NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total           numeric(10,2)  NOT NULL DEFAULT 0 CHECK (total >= 0),
  adelanto        numeric(10,2)  NOT NULL DEFAULT 0 CHECK (adelanto >= 0),
  saldo           numeric(10,2)  NOT NULL DEFAULT 0,
  saldo_texto     text,
  payment_method  text           NOT NULL,
  delivery_type   text           NOT NULL,
  via_envio       text,
  cash_tendered   numeric(10,2)  CHECK (cash_tendered >= 0),
  change_amount   numeric(10,2)  CHECK (change_amount >= 0),
  created_by      uuid           REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz    NOT NULL DEFAULT now()
);


-- =============================================================================
-- 7. CORREOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id          text                PRIMARY KEY DEFAULT ('tpl-' || gen_random_uuid()),
  type        email_template_type NOT NULL UNIQUE,
  title       text                NOT NULL,
  subject     text                NOT NULL,
  content     text                NOT NULL,
  updated_at  timestamptz         NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON email_templates;
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS email_logs (
  id               text                PRIMARY KEY DEFAULT ('email-' || gen_random_uuid()),
  order_id         text                REFERENCES orders(id) ON DELETE SET NULL,   -- NULL = correo de sistema
  tracking_code    text                NOT NULL DEFAULT 'SYS-NOTIF',
  recipient_email  text                NOT NULL,
  recipient_name   text                NOT NULL DEFAULT 'Cliente',
  subject          text                NOT NULL,
  template_type    email_template_type NOT NULL,
  status           email_status        NOT NULL DEFAULT 'pending',
  body_html        text                NOT NULL DEFAULT '',
  sent_by          uuid                REFERENCES users(id) ON DELETE SET NULL,
  sent_at          timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent  ON email_logs(sent_at DESC);


-- =============================================================================
-- 8. FUNCIONES DE SEGURIDAD
--    search_path incluye "extensions" para que crypt()/gen_salt() funcionen en
--    Supabase; en PostgreSQL normal ese esquema simplemente se ignora.
-- =============================================================================

-- ¿El usuario tiene el permiso? (usuario inactivo => false)
CREATE OR REPLACE FUNCTION fn_has_permission(p_user_id uuid, p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN role_permissions rp ON rp.role_code = u.role_code
    WHERE u.id = p_user_id
      AND u.is_active
      AND rp.permission_code = p_permission
  );
$$;

-- ¿El actor puede gestionar al usuario objetivo? Solo si su rol es de nivel
-- estrictamente MAYOR (un ADMIN nunca puede tocar a un OWNER ni a otro ADMIN).
CREATE OR REPLACE FUNCTION fn_can_manage_user(p_actor_id uuid, p_target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT fn_has_permission(p_actor_id, 'users.manage')
     AND (SELECT r.level FROM users u JOIN roles r ON r.code = u.role_code WHERE u.id = p_actor_id)
       > (SELECT r.level FROM users u JOIN roles r ON r.code = u.role_code WHERE u.id = p_target_id);
$$;

-- LOGIN: valida email + clave. Bloquea 15 min tras 5 intentos fallidos.
-- Devuelve 0 filas si las credenciales no son válidas.
CREATE OR REPLACE FUNCTION fn_login(p_email text, p_password text)
RETURNS TABLE (
  user_id      uuid,
  email        text,
  full_name    text,
  role_code    text,
  role_name    text,
  role_level   smallint,
  permissions  text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
#variable_conflict use_column
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM users u WHERE u.email = lower(btrim(p_email)) FOR UPDATE;

  IF NOT FOUND OR NOT v_user.is_active THEN
    RETURN;
  END IF;

  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    RAISE EXCEPTION 'Cuenta bloqueada temporalmente. Intenta de nuevo después de %',
      to_char(v_user.locked_until AT TIME ZONE 'America/Lima', 'HH24:MI');
  END IF;

  IF v_user.password_hash <> crypt(p_password, v_user.password_hash) THEN
    UPDATE users u
       SET failed_attempts = u.failed_attempts + 1,
           locked_until    = CASE WHEN u.failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' END
     WHERE u.id = v_user.id;

    INSERT INTO audit_log (user_id, action, entity, entity_id)
    VALUES (v_user.id, 'auth.login_failed', 'users', v_user.id::text);
    RETURN;
  END IF;

  UPDATE users u
     SET failed_attempts = 0, locked_until = NULL, last_login_at = now()
   WHERE u.id = v_user.id;

  INSERT INTO audit_log (user_id, action, entity, entity_id)
  VALUES (v_user.id, 'auth.login', 'users', v_user.id::text);

  RETURN QUERY
    SELECT u.id, u.email, u.full_name, r.code, r.name, r.level,
           COALESCE(array_agg(rp.permission_code ORDER BY rp.permission_code)
                    FILTER (WHERE rp.permission_code IS NOT NULL), '{}')
    FROM users u
    JOIN roles r ON r.code = u.role_code
    LEFT JOIN role_permissions rp ON rp.role_code = r.code
    WHERE u.id = v_user.id
    GROUP BY u.id, u.email, u.full_name, r.code, r.name, r.level;
END;
$$;

-- Crear usuario (solo quien tenga 'users.manage' y rol superior al rol nuevo).
CREATE OR REPLACE FUNCTION fn_create_user(
  p_actor_id   uuid,
  p_email      text,
  p_full_name  text,
  p_password   text,
  p_role_code  text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_actor_level smallint;
  v_role_level  smallint;
  v_new_id      uuid;
BEGIN
  IF NOT fn_has_permission(p_actor_id, 'users.manage') THEN
    RAISE EXCEPTION 'No tienes permiso para crear usuarios';
  END IF;

  IF length(p_password) < 8 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 8 caracteres';
  END IF;

  SELECT r.level INTO v_actor_level FROM users u JOIN roles r ON r.code = u.role_code WHERE u.id = p_actor_id;
  SELECT level   INTO v_role_level  FROM roles WHERE code = upper(p_role_code);

  IF v_role_level IS NULL THEN
    RAISE EXCEPTION 'Rol inexistente: %', p_role_code;
  END IF;

  IF v_role_level >= v_actor_level THEN
    RAISE EXCEPTION 'No puedes crear usuarios con un rol igual o superior al tuyo';
  END IF;

  INSERT INTO users (email, full_name, password_hash, role_code, created_by)
  VALUES (lower(btrim(p_email)), p_full_name, crypt(p_password, gen_salt('bf', 10)), upper(p_role_code), p_actor_id)
  RETURNING id INTO v_new_id;

  INSERT INTO audit_log (user_id, action, entity, entity_id, details)
  VALUES (p_actor_id, 'user.create', 'users', v_new_id::text,
          jsonb_build_object('email', lower(btrim(p_email)), 'role', upper(p_role_code)));

  RETURN v_new_id;
END;
$$;

-- Cambiar contraseña: el propio usuario (con su clave actual) o un superior.
CREATE OR REPLACE FUNCTION fn_change_password(
  p_actor_id      uuid,
  p_target_id     uuid,
  p_new_password  text,
  p_old_password  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
BEGIN
  IF length(p_new_password) < 8 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 8 caracteres';
  END IF;

  IF p_actor_id = p_target_id THEN
    SELECT password_hash INTO v_hash FROM users WHERE id = p_target_id;
    IF p_old_password IS NULL OR v_hash <> crypt(p_old_password, v_hash) THEN
      RAISE EXCEPTION 'La contraseña actual es incorrecta';
    END IF;
  ELSIF NOT fn_can_manage_user(p_actor_id, p_target_id) THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar la contraseña de este usuario';
  END IF;

  UPDATE users
     SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
         password_changed_at = now(),
         failed_attempts = 0,
         locked_until = NULL
   WHERE id = p_target_id;

  -- Invalida todas las sesiones abiertas del usuario
  UPDATE user_sessions SET revoked_at = now()
   WHERE user_id = p_target_id AND revoked_at IS NULL;

  INSERT INTO audit_log (user_id, action, entity, entity_id)
  VALUES (p_actor_id, 'user.change_password', 'users', p_target_id::text);
END;
$$;

-- Protección: siempre debe existir al menos un OWNER activo.
CREATE OR REPLACE FUNCTION fn_protect_last_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role_code = 'OWNER')
     OR (TG_OP = 'UPDATE' AND OLD.role_code = 'OWNER'
         AND (NEW.role_code <> 'OWNER' OR NOT NEW.is_active)) THEN
    IF NOT EXISTS (
      SELECT 1 FROM users
      WHERE role_code = 'OWNER' AND is_active AND id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'No se puede eliminar, desactivar ni degradar al último OWNER del sistema';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_owner ON users;
CREATE TRIGGER trg_protect_last_owner
  BEFORE UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_protect_last_owner();


-- =============================================================================
-- 9. LÓGICA DE STOCK (transaccional, a prueba de ventas simultáneas)
-- =============================================================================

-- Al insertar un ítem de pedido: valida y descuenta stock + registra movimiento.
-- Para cargar datos históricos sin afectar stock:
--   SET LOCAL obsidiana.skip_stock_trigger = 'on';
CREATE OR REPLACE FUNCTION fn_order_item_deduct_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_product      products%ROWTYPE;
  v_order_number text;
BEGIN
  IF current_setting('obsidiana.skip_stock_trigger', true) = 'on' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_product FROM products WHERE id = NEW.product_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', NEW.product_name;
  END IF;

  IF v_product.stock < NEW.quantity THEN
    RAISE EXCEPTION 'Stock insuficiente para %. Stock actual: %, Solicitado: %',
      v_product.name, v_product.stock, NEW.quantity;
  END IF;

  UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;

  SELECT order_number INTO v_order_number FROM orders WHERE id = NEW.order_id;

  INSERT INTO stock_movements
    (product_id, product_name, type, quantity, stock_before, stock_after, reason, performed_by, order_id)
  VALUES
    (v_product.id, v_product.name, 'out', NEW.quantity, v_product.stock, v_product.stock - NEW.quantity,
     'Venta realizada - Pedido ' || v_order_number, 'Sistema de Pedidos', NEW.order_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_deduct_stock ON order_items;
CREATE TRIGGER trg_order_items_deduct_stock
  BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION fn_order_item_deduct_stock();

-- Al cancelar un pedido: devuelve el stock y registra el movimiento de reingreso.
CREATE OR REPLACE FUNCTION fn_order_cancel_restock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.status = 'cancelado' AND OLD.status <> 'cancelado' THEN
    FOR r IN
      SELECT oi.product_id, oi.quantity, p.name, p.stock
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
      FOR UPDATE OF p
    LOOP
      UPDATE products SET stock = stock + r.quantity WHERE id = r.product_id;

      INSERT INTO stock_movements
        (product_id, product_name, type, quantity, stock_before, stock_after, reason, performed_by, order_id)
      VALUES
        (r.product_id, r.name, 'in', r.quantity, r.stock, r.stock + r.quantity,
         'Reingreso por cancelación - Pedido ' || NEW.order_number, 'Sistema de Pedidos', NEW.id);
    END LOOP;
  ELSIF OLD.status = 'cancelado' AND NEW.status <> 'cancelado' THEN
    RAISE EXCEPTION 'Un pedido cancelado no puede reactivarse. Registra un pedido nuevo.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_cancel_restock ON orders;
CREATE TRIGGER trg_orders_cancel_restock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_order_cancel_restock();

-- Ajuste manual de stock (entrada / salida / ajuste a valor exacto).
CREATE OR REPLACE FUNCTION fn_adjust_stock(
  p_actor_id    uuid,
  p_product_id  text,
  p_type        stock_movement_type,
  p_quantity    integer,
  p_reason      text DEFAULT 'Ajuste manual de stock'
)
RETURNS stock_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_product   products%ROWTYPE;
  v_new_stock integer;
  v_actor     text;
  v_movement  stock_movements%ROWTYPE;
BEGIN
  IF NOT fn_has_permission(p_actor_id, 'inventory.adjust') THEN
    RAISE EXCEPTION 'No tienes permiso para ajustar stock';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 0 OR (p_type <> 'adjustment' AND p_quantity = 0) THEN
    RAISE EXCEPTION 'Ingresa una cantidad válida';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  v_new_stock := CASE p_type
    WHEN 'in'         THEN v_product.stock + p_quantity
    WHEN 'out'        THEN v_product.stock - p_quantity
    WHEN 'adjustment' THEN p_quantity
  END;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'No se puede retirar más del stock disponible (%)', v_product.stock;
  END IF;

  UPDATE products SET stock = v_new_stock WHERE id = p_product_id;

  SELECT full_name INTO v_actor FROM users WHERE id = p_actor_id;

  INSERT INTO stock_movements
    (product_id, product_name, type, quantity, stock_before, stock_after, reason, performed_by, user_id)
  VALUES
    (v_product.id, v_product.name, p_type, p_quantity, v_product.stock, v_new_stock,
     COALESCE(NULLIF(btrim(p_reason), ''), 'Ajuste manual de stock'), COALESCE(v_actor, 'Administrador'), p_actor_id)
  RETURNING * INTO v_movement;

  INSERT INTO audit_log (user_id, action, entity, entity_id, details)
  VALUES (p_actor_id, 'stock.adjust', 'products', p_product_id,
          jsonb_build_object('type', p_type, 'quantity', p_quantity,
                             'before', v_product.stock, 'after', v_new_stock));

  RETURN v_movement;
END;
$$;

-- Recalcula subtotal/total del pedido cuando cambian sus ítems.
CREATE OR REPLACE FUNCTION fn_recalc_order_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id text := COALESCE(NEW.order_id, OLD.order_id);
BEGIN
  UPDATE orders o
     SET subtotal = s.subtotal,
         total    = GREATEST(s.subtotal + o.shipping_fee - o.discount, 0)
    FROM (SELECT COALESCE(sum(total), 0) AS subtotal FROM order_items WHERE order_id = v_order_id) s
   WHERE o.id = v_order_id
     AND (o.subtotal IS DISTINCT FROM s.subtotal
          OR o.total IS DISTINCT FROM GREATEST(s.subtotal + o.shipping_fee - o.discount, 0));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_recalc ON order_items;
CREATE TRIGGER trg_order_items_recalc
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION fn_recalc_order_totals();


-- =============================================================================
-- 10. VISTAS PARA REPORTES Y DASHBOARD
-- =============================================================================

CREATE OR REPLACE VIEW v_users AS
SELECT u.id, u.email, u.full_name, u.role_code, r.name AS role_name, r.level AS role_level,
       u.is_active, u.last_login_at, u.created_at
FROM users u
JOIN roles r ON r.code = u.role_code;

CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT id, sku, name, category, stock, min_stock, location
FROM products
WHERE is_active AND stock <= min_stock
ORDER BY stock ASC, name;

CREATE OR REPLACE VIEW v_system_stats AS
SELECT
  (SELECT count(*) FROM orders)                                                           AS total_orders,
  (SELECT COALESCE(sum(total), 0) FROM orders WHERE status <> 'cancelado')                AS total_sales,
  (SELECT count(*) FROM orders WHERE status IN ('pendiente', 'en_preparacion', 'en_ruta')) AS pending_deliveries,
  (SELECT count(*) FROM products WHERE is_active AND stock <= min_stock)                  AS low_stock_products,
  (SELECT CASE WHEN count(*) = 0 THEN 0
               ELSE round(100.0 * count(*) FILTER (WHERE status = 'entregado') / count(*), 1) END
     FROM orders WHERE status <> 'cancelado')                                             AS delivered_rate;

CREATE OR REPLACE VIEW v_sales_daily AS
SELECT (created_at AT TIME ZONE 'America/Lima')::date AS sale_date,
       count(*)                                        AS orders,
       sum(subtotal)                                   AS subtotal,
       sum(shipping_fee)                               AS shipping,
       sum(total)                                      AS total
FROM orders
WHERE status <> 'cancelado'
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW v_sales_by_category AS
SELECT p.category,
       sum(oi.quantity) AS units_sold,
       sum(oi.total)    AS revenue
FROM order_items oi
JOIN orders   o ON o.id = oi.order_id AND o.status <> 'cancelado'
JOIN products p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY revenue DESC;

CREATE OR REPLACE VIEW v_top_products AS
SELECT oi.product_id, oi.sku, max(oi.product_name) AS product_name,
       sum(oi.quantity) AS units_sold,
       sum(oi.total)    AS revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelado'
GROUP BY oi.product_id, oi.sku
ORDER BY units_sold DESC;

CREATE OR REPLACE VIEW v_sales_by_zone AS
SELECT COALESCE(customer_zone, 'Sin zona') AS zone,
       customer_province                   AS province,
       count(*)                            AS orders,
       sum(total)                          AS revenue
FROM orders
WHERE status <> 'cancelado'
GROUP BY 1, 2
ORDER BY revenue DESC;


-- =============================================================================
-- 11. ROW LEVEL SECURITY Y PERMISOS PARA SUPABASE
-- =============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles', 'permissions', 'role_permissions', 'users', 'user_sessions', 'audit_log',
    'provinces', 'zones', 'districts', 'shipping_agencies',
    'categories', 'products', 'stock_movements',
    'orders', 'order_items', 'order_timeline', 'sale_receipts',
    'email_templates', 'email_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- Políticas de lectura pública (Catálogo, geografía y agencias)
DROP POLICY IF EXISTS "p_public_provinces" ON provinces;
CREATE POLICY "p_public_provinces" ON provinces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_zones" ON zones;
CREATE POLICY "p_public_zones" ON zones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_districts" ON districts;
CREATE POLICY "p_public_districts" ON districts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_agencies" ON shipping_agencies;
CREATE POLICY "p_public_agencies" ON shipping_agencies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_categories" ON categories;
CREATE POLICY "p_public_categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_products" ON products;
CREATE POLICY "p_public_products" ON products FOR ALL USING (true) WITH CHECK (true);

-- Políticas para Pedidos, Tracking y POS
DROP POLICY IF EXISTS "p_public_orders" ON orders;
CREATE POLICY "p_public_orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_order_items" ON order_items;
CREATE POLICY "p_public_order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_order_timeline" ON order_timeline;
CREATE POLICY "p_public_order_timeline" ON order_timeline FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_sale_receipts" ON sale_receipts;
CREATE POLICY "p_public_sale_receipts" ON sale_receipts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_stock_movements" ON stock_movements;
CREATE POLICY "p_public_stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_email_logs" ON email_logs;
CREATE POLICY "p_public_email_logs" ON email_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_email_templates" ON email_templates;
CREATE POLICY "p_public_email_templates" ON email_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_public_roles" ON roles;
CREATE POLICY "p_public_roles" ON roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "p_public_permissions" ON permissions;
CREATE POLICY "p_public_permissions" ON permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "p_public_role_permissions" ON role_permissions;
CREATE POLICY "p_public_role_permissions" ON role_permissions FOR SELECT USING (true);

-- Usuarios y auditoría protegidos (solo lectura por vista o RPC)
DROP POLICY IF EXISTS "p_auth_users" ON users;
CREATE POLICY "p_auth_users" ON users FOR SELECT USING (true);

-- Permisos de ejecución de funciones para Supabase (anon y authenticated)
DO $$
DECLARE
  role text;
BEGIN
  FOREACH role IN ARRAY ARRAY['anon', 'authenticated', 'service_role']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', role);
      EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA public TO %I', role);
      EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_login(text, text) TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_has_permission(uuid, text) TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_can_manage_user(uuid, uuid) TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_adjust_stock(uuid, text, stock_movement_type, integer, text) TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_change_password(uuid, uuid, text, text) TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_create_user(uuid, text, text, text, text) TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_next_order_number() TO %I', role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION fn_generate_tracking_code() TO %I', role);
    END IF;
  END LOOP;
END
$$;

COMMIT;


-- =============================================================================
--  OBSIDIANA STORE — SEGURIDAD: ROLES, PERMISOS Y USUARIOS
--  Archivo 2 de 3. Ejecutar después de 01_schema.sql.
--
--  Jerarquía:
--    OWNER (nivel 100) -> acceso TOTAL al sistema.
--    ADMIN (nivel  50) -> acceso operativo, por debajo del OWNER:
--                         NO puede gestionar usuarios, ver auditoría, cambiar
--                         configuración, reiniciar datos ni eliminar registros.
--
--  Las contraseñas se guardan con bcrypt (nunca en texto plano).
--  ⚠ Cambia las contraseñas iniciales después del primer ingreso.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ROLES
-- -----------------------------------------------------------------------------
INSERT INTO roles (code, name, description, level) VALUES
  ('OWNER', 'Propietario',   'Dueño del negocio. Acceso total a todos los módulos, usuarios y configuración.', 100),
  ('ADMIN', 'Administrador', 'Gestión operativa diaria (ventas, pedidos, inventario, envíos). Por debajo del OWNER.', 50)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description, level = EXCLUDED.level;


-- -----------------------------------------------------------------------------
-- 2. PERMISOS (uno por acción de cada módulo del Sidebar)
-- -----------------------------------------------------------------------------
INSERT INTO permissions (code, module, description) VALUES
  -- Punto de venta
  ('pos.use',               'pos',       'Usar el Punto de Venta y emitir Notas de Venta'),
  -- Pedidos
  ('orders.view',           'orders',    'Ver listado y detalle de pedidos'),
  ('orders.create',         'orders',    'Registrar pedidos nuevos'),
  ('orders.update_status',  'orders',    'Cambiar estado del pedido y asignar courier'),
  ('orders.cancel',         'orders',    'Cancelar pedidos (devuelve stock)'),
  ('orders.delete',         'orders',    'Eliminar pedidos definitivamente'),
  -- Inventario
  ('inventory.view',        'inventory', 'Ver inventario y movimientos de stock'),
  ('inventory.create',      'inventory', 'Crear productos'),
  ('inventory.edit',        'inventory', 'Editar productos (nombre, precio, ubicación)'),
  ('inventory.adjust',      'inventory', 'Registrar entradas, salidas y ajustes de stock'),
  ('inventory.delete',      'inventory', 'Eliminar / desactivar productos'),
  -- Envíos & Zonas
  ('shipping.view',         'shipping',  'Ver zonas, distritos, tarifas y agencias'),
  ('shipping.manage',       'shipping',  'Crear y editar zonas, distritos y tarifas'),
  -- Tracking
  ('tracking.view',         'tracking',  'Consultar seguimiento de pedidos'),
  -- Reportes
  ('reports.view',          'reports',   'Ver reportes y estadísticas de ventas'),
  ('reports.export',        'reports',   'Exportar reportes'),
  -- Correos
  ('emails.view',           'emails',    'Ver historial de correos enviados'),
  ('emails.send',           'emails',    'Enviar correos a clientes'),
  ('emails.templates',      'emails',    'Editar plantillas de correo'),
  -- Usuarios
  ('users.view',            'users',     'Ver usuarios del sistema'),
  ('users.manage',          'users',     'Crear, editar, desactivar usuarios y cambiar claves'),
  -- Sistema
  ('system.settings',       'system',    'Modificar configuración general del sistema'),
  ('system.audit',          'system',    'Ver bitácora de auditoría'),
  ('system.reset_data',     'system',    'Restablecer / reiniciar datos del sistema')
ON CONFLICT (code) DO UPDATE
  SET module = EXCLUDED.module, description = EXCLUDED.description;


-- -----------------------------------------------------------------------------
-- 3. ASIGNACIÓN DE PERMISOS A ROLES
-- -----------------------------------------------------------------------------

-- OWNER: TODOS los permisos.
INSERT INTO role_permissions (role_code, permission_code)
SELECT 'OWNER', code FROM permissions
ON CONFLICT DO NOTHING;

-- ADMIN: todos excepto los reservados al OWNER.
DELETE FROM role_permissions
 WHERE role_code = 'ADMIN'
   AND permission_code IN ('orders.delete', 'inventory.delete', 'users.manage',
                           'system.settings', 'system.audit', 'system.reset_data');

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'ADMIN', code
FROM permissions
WHERE code NOT IN (
  'orders.delete',       -- eliminar pedidos
  'inventory.delete',    -- eliminar productos
  'users.manage',        -- gestionar usuarios
  'system.settings',     -- configuración
  'system.audit',        -- auditoría
  'system.reset_data'    -- reiniciar datos
)
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 4. USUARIOS INICIALES
--    ON CONFLICT DO NOTHING: si vuelves a ejecutar el script NO sobrescribe
--    contraseñas que ya hayan sido cambiadas.
-- -----------------------------------------------------------------------------
INSERT INTO users (email, full_name, password_hash, role_code)
VALUES
  ('valentino@obsidiana.com', 'Valentino', crypt('30092023',   gen_salt('bf', 10)), 'OWNER'),
  ('ruben@obsidiana.com',     'Rubén',     crypt('3009202620', gen_salt('bf', 10)), 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- El ADMIN queda registrado como creado por el OWNER.
UPDATE users
   SET created_by = (SELECT id FROM users WHERE email = 'valentino@obsidiana.com')
 WHERE email = 'ruben@obsidiana.com'
   AND created_by IS NULL;

COMMIT;


-- -----------------------------------------------------------------------------
-- VERIFICACIÓN RÁPIDA (opcional, ejecutar por separado)
-- -----------------------------------------------------------------------------
-- SELECT * FROM v_users;
-- SELECT * FROM fn_login('valentino@obsidiana.com', '30092023');
-- SELECT * FROM fn_login('ruben@obsidiana.com', '3009202620');
-- SELECT fn_has_permission((SELECT id FROM users WHERE email='ruben@obsidiana.com'), 'users.manage');  -- false


-- =============================================================================
--  OBSIDIANA STORE — DATOS INICIALES (catálogo + datos demo)
--  Archivo 3 de 3. Ejecutar después de 02_seed_security.sql.
--  Generado automáticamente desde src/data/mockData.ts y shippingAgencies.ts
--  Fecha de generación: 2026-10-09T00:50:37.285Z
--  Re-ejecutable: ON CONFLICT DO NOTHING (no duplica ni sobrescribe).
-- =============================================================================

BEGIN;

-- Los pedidos demo son históricos: NO deben descontar stock otra vez.
SET LOCAL obsidiana.skip_stock_trigger = 'on';

-- 1. PROVINCIAS ---------------------------------------------------------------
INSERT INTO provinces (id, name, code) VALUES
  ('prov-lim', 'Lima', 'LIM'),
  ('prov-aqp', 'Arequipa', 'AQP'),
  ('prov-lal', 'La Libertad (Trujillo)', 'LAL'),
  ('prov-cus', 'Cusco', 'CUS'),
  ('prov-piu', 'Piura', 'PIU')
ON CONFLICT DO NOTHING;

-- 2. ZONAS DE ENVÍO -----------------------------------------------------------
INSERT INTO zones (id, name, province_id, shipping_fee, estimated_days, courier_assigned, status) VALUES
  ('zone-lim-centro', 'Lima Centro Express', 'prov-lim', 10, 'Mismo Día / 24 hrs', 'Motorizados Express Urbano (Carlos Ruiz)', 'active'),
  ('zone-lim-moderna', 'Lima Moderna & Residencial', 'prov-lim', 12.5, '24 - 48 hrs', 'Flota Rapida SAC (Jorge Mendoza)', 'active'),
  ('zone-lim-periferia', 'Lima Norte / Sur Expreso', 'prov-lim', 18, '24 - 48 hrs', 'Cargo Express Peru', 'active'),
  ('zone-aqp-urbano', 'Arequipa Metropolitana', 'prov-aqp', 22, '2 - 3 días hábiles', 'Arequipa Cargo Express', 'active'),
  ('zone-lal-trujillo', 'Trujillo Metropolitano', 'prov-lal', 20, '2 - 3 días hábiles', 'Servicios Logísticos del Norte', 'active'),
  ('zone-cus-imperial', 'Cusco Valle & Ciudad', 'prov-cus', 28, '3 - 4 días hábiles', 'Andes Express Cargo', 'active')
ON CONFLICT DO NOTHING;

-- 3. DISTRITOS ----------------------------------------------------------------
INSERT INTO districts (id, province_id, zone_id, name) VALUES
  ('dist-miraflores', 'prov-lim', 'zone-lim-moderna', 'Miraflores'),
  ('dist-san-isidro', 'prov-lim', 'zone-lim-moderna', 'San Isidro'),
  ('dist-surco', 'prov-lim', 'zone-lim-moderna', 'Santiago de Surco'),
  ('dist-san-borja', 'prov-lim', 'zone-lim-moderna', 'San Borja'),
  ('dist-lima-cercado', 'prov-lim', 'zone-lim-centro', 'Cercado de Lima'),
  ('dist-breña', 'prov-lim', 'zone-lim-centro', 'Breña'),
  ('dist-los-olivos', 'prov-lim', 'zone-lim-periferia', 'Los Olivos'),
  ('dist-san-juan-miraflores', 'prov-lim', 'zone-lim-periferia', 'San Juan de Miraflores'),
  ('dist-cayma', 'prov-aqp', 'zone-aqp-urbano', 'Cayma'),
  ('dist-yanahuara', 'prov-aqp', 'zone-aqp-urbano', 'Yanahuara'),
  ('dist-aqp-cercado', 'prov-aqp', 'zone-aqp-urbano', 'Arequipa Cercado'),
  ('dist-trujillo-cercado', 'prov-lal', 'zone-lal-trujillo', 'Trujillo Cercado'),
  ('dist-victor-larco', 'prov-lal', 'zone-lal-trujillo', 'Víctor Larco Herrera'),
  ('dist-wanchaq', 'prov-cus', 'zone-cus-imperial', 'Wanchaq'),
  ('dist-san-sebastian', 'prov-cus', 'zone-cus-imperial', 'San Sebastián')
ON CONFLICT DO NOTHING;

-- 4. AGENCIAS SHALOM / OLVA (387) ------------------------------------------
INSERT INTO shipping_agencies (company, department, city, district, address, phone, hours) VALUES
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Circunvalación Mz. B-5 Lt. 20', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Malecón Miguel Checa Eguiguren N° 167 y 169', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Santa Rosa Mz. D1 Lote 1, Urb. Los Álamos 2da Etapa', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. 13 de Enero N° 2057, Urb. San Hilarión', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Central Mz. R9 Lote 3, Programa Ciudad de Mcal. Cáceres', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Santa Rosa de Lima Mz. D Lt. 4 (cruce Av. El Sol)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Programa Ciudad de Mcal. Cáceres, Sector III Mz. Q8 Lt. 11', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Fernando Wiesse Mz. E8 Lote 38B, Bayóvar', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Malecón Checa Mz. B Lt. 7, Urb. Campoy', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Calle San Martín con Av. Comercial Norte 189, Canto Grande', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Fernando Wiesse Mz. Q Lote 1, AA.HH. Cruz de Motupe', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Jr. Chinchaysuyo 468, Zárate', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Mz. B1 Lt. 25, Urbanización Los Pinos', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Canto Grande N° 2570, Urb. Ganímedes (Las Flores)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Próceres de la Independencia N° 1295-1299', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Alejandro Bertello Bollati Mz. H Lt. 2-A', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. José Granda 3826, Urb. Condevilla', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. José Granda 2546', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Canta Callao Mz. A Lt. 3, Urb. Arizona (cruce con Los Alisos)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Canta Callao Mz. A Lt. 3, Asoc. Brisas Santa Rosa (cruce con Izaguirre)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Carlos Izaguirre Sub Lt. 8, Mz. C, cdra. 23', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Los Dominicos 1460, Urb. Los Cipreses', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Gerardo Unger 6475, Urb. Santa Luisa', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Lima 3899', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Perú 1589', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Universitaria 1619, Urb. María Gracia de Antares', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Miguel Ángel N° 235, Urb. Fiori 4ta Etapa', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Germán Aguirre Ugarte 649, Urb. San Germán', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Martín de Porres', 'Av. Próceres N° 588, Urb. Covicem', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. Esperanza Mz. K Lt. 06, Las Américas', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. Marco Puente Llanos 309, Mz. A, Lt. 03', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. El Sol Mz. S Lt. 2, Zona 03', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. Horacio Zevallos Mz. V Lt. 12, Huaycán', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. José Carlos Mariátegui Z. E Lt. 23, Huaycán', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Carretera Central Km. 17, Mz. E Lt. 1, Huaycán (entrada)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. José Carlos Mariátegui Mz. B Lte. 06, Huaycán (El Descanso)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. Santa Rosa N° 773, Mz. A Lote 6, Los Sauces', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. Nicolás Ayllón N° 3080, Puente Santa Anita', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. Pedro Ruiz Gallo Mz. H Lt. 3, Santa Clara', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ate', 'Av. Ferrocarril Mz. C Lt. 19, Parcela 3, Urb. Santa Elvira', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Av. Huandoy Mz. 72 Lte. 54 (cruce Av. Central)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Av. Próceres Mz. 3, Lt. 23, A.H. Laura Caller (cruce Av. Huandoy/Marañón)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Av. Angélica Gamarra de León Valverde N° 621', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Calle David Alva Mz. H Lote 4 (Av. Carlos Izaguirre cdra. 14)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Av. 2 de Octubre Mz. H Lt. 2', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Av. Las Palmeras N° 5236, Urb. Villa Norte', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Av. Los Platinos N° 259, Mz. A Lt. 17', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Los Olivos', 'Av. Los Próceres Mz. PP2 Lt. 21, Urb. Puertas de Pro', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Carabayllo', 'Av. José Saco Rojas Mz. A Lt. 15', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Carabayllo', 'Mz. 1A, Lt. 8, Av. Túpac Amaru N° 10472 (Km. 19)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Carabayllo', 'Av. Túpac Amaru Km. 23.5', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Carabayllo', 'Av. Túpac Amaru N° 441-443, Mz. O2 Lt. 35 (El Establo)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Carabayllo', 'Av. Túpac Amaru 3493, P.J. El Progreso (Km. 22)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Carabayllo', 'Av. A Mz. L2 Lt. 20, Urb. Santo Domingo', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Carabayllo', 'Av. Trapiche Mz. P Lt. 48, Urb. Tungasuca', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Comas', 'Av. Túpac Amaru 5725-5727, Urb. Huaquillay (cdra. 57)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Comas', 'Av. Universitaria N° 7241 (El Retablo)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Comas', 'Av. Trapiche 886, A-16, 2P-2, Urb. Pinar', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Comas', 'Av. Universitaria Norte Mz. Q1 Lte. 030, Parque Sinchi Roca', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Comas', 'Av. Túpac Amaru N° 7837-7839, Mz. C Lt. 010, Año Nuevo', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'La Molina', 'Av. Flora Tristán N° 885, Urb. Santa Patricia', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'La Molina', 'Av. La Fontana 440 (C.C. La Rotonda II, local 1018)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'La Molina', '', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado (agencia ref. Av. La Molina cdra. 35)'),
  ('Shalom', 'Lima', 'Lima', 'La Molina', 'Av. Los Fresnos 1305, Tienda 2, Urb. Portada del Sol', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'La Molina', 'Av. La Molina 2448 (Parque La Molina)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Puente Piedra', 'Av. Buenos Aires Mz. D, Sub-lote 188E1', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Puente Piedra', 'Av. San Lorenzo Mz. C Lt. 20', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Puente Piedra', 'Av. Miguel Grau Mz. A Lt. 07 y 08 (Óvalo Puente Piedra)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Puente Piedra', 'Panamericana Norte Km. 32.5 (Puente Arica)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Puente Piedra', 'Av. Ancón 678, Zapallal', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Miraflores', 'Av. de los Héroes N° 228, Atocongo', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Miraflores', 'Av. Almirante Miguel Grau Mz. Y3 Lt. 29, Pamplona Alta', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Miraflores', 'Av. San Juan Mz. 24 Lt. 1, Pamplona Alta', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Miraflores', 'Av. Canevaro 336-A', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Juan de Miraflores', 'Av. Los Héroes 1140 (María Auxiliadora)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa María del Triunfo', 'Av. Lima 2208, José Gálvez', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa María del Triunfo', 'Av. Villa María Mz. G12 Lt. 9', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa María del Triunfo', 'Av. Pachacútec 6779, Mz. N, Lt. 20 (Las Conchitas)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa María del Triunfo', 'Av. 26 de Noviembre 1728B-1728C, Mz. 90 (Nueva Esperanza)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa María del Triunfo', 'Av. Pachacútec N° 3548 (El Pesquero)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Cercado de Lima', 'Av. Nicolás Dueñas 584, Mz. C Lt. 4', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Cercado de Lima', 'Av. Tingo María N° 1252-A', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Cercado de Lima', 'Jr. Presbítero García Villón N° 560, Malvinas', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Cercado de Lima', 'Jr. Ricardo Treneman N° 920, Malvinas', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Chorrillos', 'Av. Santa Anita N° 580', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Chorrillos', 'Av. Los Faisanes 420', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Chorrillos', 'Av. 12 de Octubre Mz. A-03, Lt. 02 (Las Delicias de Villa)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Chorrillos', 'Av. Alameda Sur 5 (Megaplaza Chorrillos)', '01-5007878', 'Lun-Dom 10:00am-7:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Independencia', 'Calle A, Mz. D Lt. 26, Urbanización Panamericana', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Independencia', 'Av. Túpac Amaru N° 4708-4710 (La Cincuenta)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Independencia', 'C.C. Mega Plaza, Av. Alfredo Mendiola 3698', '01-5007878', 'Lun-Dom 10:00am-8:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Independencia', 'Av. Gerardo Unger N° 6917 Int. LB 19 (Plaza Norte, entregas)', NULL, 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa El Salvador', 'Av. 01 de Mayo 1, Sect. GP 23-A, Mz. N Lote 13', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa El Salvador', 'Av. César Vallejo, Mz. F Lt. 1, Sect. 2', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa El Salvador', 'Mz. B Lt. 3, Barrio 3, Sector 2, 4ta Etapa (Av. Pastor Sevilla)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Villa El Salvador', 'Av. Pastor Sevilla, Sect. 6, GP 7, Mz. A Lote 05 (Óvalo Mariátegui)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'La Victoria', 'Av. México 1125', '01-5007878', 'Lun-Sáb 8:00am-9:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'La Victoria', 'Av. Canadá 1603', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'La Victoria', 'Jr. Antonio Raymondi N° 113', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Lurigancho', 'Calle El Sol 124 (Parque Echenique, Chosica)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Lurigancho', 'Huachipa Este, Mz. A18 Lote 1, 2, 3', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Lurigancho', 'Av. Circunvalación Mz. A Lt. 1-D-C-P, Santa María de Huachipa', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Pachacamac', 'Av. Manuel Valle, Sub-lote 2-1, N° de Parcela J', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Pachacamac', 'Av. Prolongación de la Av. La Molina, Mz. E Lote 21 (La Curva de Manchay)', '01-5007878', 'Lun-Sáb 8:00am-7:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Pachacamac', 'Av. Víctor Malásquez Mz. B11, Sub-lote 06-A (Manchay Tres Marías)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Santiago de Surco', 'Av. Santiago de Surco N° 4348 (La Bolichera, cruce Av. Tomás Marsano)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Santiago de Surco', 'Calle Barlovento N° 134 (Higuereta)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Santiago de Surco', 'Av. San Juan Mz. A Lote 01 (Mateo Pumacahua)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Breña', 'Av. Venezuela 1670', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Breña', 'Jr. Huaraz 1633', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'El Agustino', 'Jr. Ancash Mz. B Lt. 11, AA.HH. Ancieta Alta', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'El Agustino', 'Av. 1° de Mayo 3071, Urb. Huancayo (Puente Nuevo)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Jesús María', 'Av. Mariscal Luzuriaga 584-586', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Jesús María', 'C.C. Real Plaza Salaverry, Av. Gral. Salaverry 2370', '01-5007878', 'Lun-Dom 11:00am-8:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Lince', 'Av. Coronel José Leal 648, Urb. Fundo Lobatón (cdra. 6)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Lince', 'Jr. Domingo Casanova N° 318 (cruce Petit Thouars)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Lurín', 'Av. Antigua Panamericana Sur Km. 37, Mz. C Lt. 17 (Nuevo Lurín)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Lurín', 'Antigua Panamericana Sur, Lote 2, Mz. B, 1er piso (Puente Lurín)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom cerrado'),
  ('Shalom', 'Lima', 'Lima', 'Pueblo Libre', 'Av. Bolívar 1097', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Pueblo Libre', 'Av. La Marina 1640', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Rímac', 'Av. Amancaes N° 644, Urb. Ciudad y Campo', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Rímac', 'Sección Inmobiliaria N° 2, Lt. 11, Mz. 2 (cdra. 9 Av. Guardia Republicana)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Borja', 'Av. Angamos Este 2521', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'San Borja', 'Av. Aviación 2819, Urb. San Borja Sur', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Santa Anita', 'Av. Santa Rosa N° 147, Urb. Santa Anita', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Santa Anita', '', NULL, 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm (agencia ref. Av. Huarochirí)'),
  ('Shalom', 'Lima', 'Lima', 'Surquillo', 'Av. Principal 995, Lt. 12 Mz. G', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Surquillo', 'Av. República de Panamá N° 5115', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Cieneguilla', 'Av. Arterial Huarochirí D, Mz. B Lt. 19', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Magdalena del Mar', 'Jr. Ayacucho N° 756', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Miraflores', 'Malecón de la Reserva 610 (Larcomar)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Punta Hermosa', 'Av. García Rada Mz. B Lt. 04', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Lima', 'Lima', 'Ancón', 'Mz. L23, Urb. Coovitiomar (Santa Rosa)', '01-5007878', 'Lun-Sáb 8:00am-8:00pm; Dom 8:00am-5:00pm'),
  ('Shalom', 'Callao', 'Callao', 'Callao', 'Av. Alejandro Bertello Bollati Mz. B Lt. 20 y 21, Urb. Progresiva Bahía Blanca (frente al mercado Costa Azul)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'Callao', 'Av. Elmer Faucett 492-484 (Shalom Empresarial)', '920-460874', 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'Callao', 'Av. Sáenz Peña N° 414-416 (cruce Av. Marco Polo)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'Callao', 'Unidad Inmobiliaria N° 1, Av. Quilca Mz. G Sub Lt. 11C, Urb. Aeropuerto (frente a iglesia Testigos de Jehová, cruce Calle 1)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'Bellavista', 'Av. Elmer Faucett 1641, Urb. Jardines Virú Mz. B Lt. 46 (2 cuadras de cruce Faucett/Venezuela)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'La Perla', 'Av. La Marina 530, Urb. Benjamín Doigg Lossio (3 cuadras del óvalo de La Perla)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'Mi Perú', 'Av. Víctor Raúl Haya de la Torre Mz. A Lt. 02, A.H. Confraternidad III Sector (cruce con Av. Arequipa)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'Ventanilla', 'Calle 19, Mz. J Lt. 26, Urb. Coop. de la Marina (costado lubricentro Pablito Romero)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Callao', 'Callao', 'Ventanilla', 'UPIS Proyecto Especial Ciudad Pachacútec, Mz. A, Lt. 23, Sect. G (Grifo Repsol, cruce Av. 225 con Av. Los Arquitectos)', NULL, 'Lun-Sáb 8:00am-7:00pm; Dom cerrado'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Arequipa (Cercado)', 'Av. Parra 379', '(01) 500 7878', 'Lunes a sábado 7:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'La Joya', 'La Joya', 'Lateral 12, Lote 32', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Alto Selva Alegre', 'Av. Lima 406', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Alto Selva Alegre', 'Augusto Salazar Bondy, Mz. J, Lote 4', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cayma', 'Av. Ramón Castilla 1000-B', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cayma', 'Av. Charcani 401', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cerro Colorado', 'Centro Industrial Las Canteras, Mz. A, Sub Lote 2', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cerro Colorado', 'Av. 54, Zona 2, Mz. J, Lote 8', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cerro Colorado', 'Av. Pumacahua, Urb. San Felipe, Lote 14', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cerro Colorado', 'Av. Yaraví 507-B, Zamácola', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cerro Colorado', 'Av. Los Incas 604', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cerro Colorado', 'Asociación Urbanizadora Peruarbo, Autopista La Joya', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Cerro Colorado', 'Mz. H, Lote 12, Nuevo Horizonte', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Jacobo Hunter', 'Calle Argentina 405-A', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Mariano Melgar', 'Calle Ancash 202', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Miraflores', 'Av. Goyeneche 1422', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Paucarpata', 'Calle Belén 100, Urb. Manuel Prado', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Paucarpata', 'Av. Jesús 1100', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Socabaya', 'Av. Socabaya 302, Urb. San Martín', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Socabaya', 'Asociación Urbano Municipal Horacio Zeballos, Sector E, Mz. 1, Lote 18', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Uchumayo', 'Urb. El Carmen, Mz. E, Lote 1', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 6:00 p.m.'),
  ('Shalom', 'Arequipa', 'Arequipa', 'Yura', 'Ciudad de Dios, Mz. O, Lote 4, Zona 2', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Camaná', 'Camaná', 'Calle Agustín Gamarra 451', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Chala', 'Chala', 'Av. Emancipación Mz. 51, Lote 3', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Majes (Pedregal)', 'Majes', 'La Parcela 180, Lote 4, Pedregal', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Mollendo', 'Mollendo', 'Av. Mariscal Castilla 472-A', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Cocachacra', 'Cocachacra', 'Cerro Poblado, Mz. N5, Sub Lote 5B', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Arequipa', 'Matarani', 'Matarani (Islay)', 'Asentamiento Humano Puerto Nuevo, Mz. 1, Lote 18', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'Cusco', 'Arco Ticatica Pustipata, Lt. N° A-11-2', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'San Jerónimo', 'Calle Ciro Alegría 226-224', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'San Sebastián', 'Urb. Cachimayo A-37, Av. La Cultura', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'San Sebastián', 'Urb. Tupac Amaru B-1-2, Vía Expresa Sur', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'Santiago', 'Prolongación Av. Antonio Lorena #140', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'Santiago', 'Av. Industrial J-20, Urb. Bancopata', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'Wanchaq', 'Av. Las Américas Mz. E, Lt. 20, Urb. Parque Industrial', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'Wanchaq', 'Av. Pachacutec 429', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Cusco', 'Wanchaq', 'Velasco Astete D3', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Sicuani', 'Sicuani (Canchis)', 'Prolongación Av. Arequipa 1010 S/N, Óvalo San Andrés', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Sicuani', 'Sicuani (Canchis)', 'Jr. Inambari N° 208', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Combapata', 'Combapata (Canchis)', 'Av. Señor de Huanca S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Espinar', 'Espinar', 'Av. Tintaya N° 215', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cusco', 'Calca', 'Calca', 'Av. Vilcanota Mz. A, Lt. 4', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Pisac', 'Pisac', 'Av. Vilcanota S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Urubamba', 'Urubamba', 'Asoc. Pro Vivienda Vilcanota', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Chinchero', 'Chinchero', 'Av. Mateo Pumacahua S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Urcos', 'Urcos (Quispicanchi)', 'Mayupata S/N, Paucarbamba', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Oropesa', 'Oropesa (Quispicanchi)', 'Sector Chimpapampa, Apv. José Carlos Mariátegui S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Anta (Izcuchaca)', 'Anta', 'Parque del Carmen Lt. 1, Mz. B2', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cusco', 'Quillabamba', 'La Convención', 'Jr. Puno Lt. 10 y 11, Mz. G, Urb. Santa Ana', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Trujillo', 'Calle Liverpool N° 329, Urb. Santa Isabel', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Trujillo', 'Av. La Perla Mz. E, Lote 05, Urb. Ingeniería', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Trujillo', 'Calle Atahualpa 481', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Trujillo', 'Calle Santa Cruz N° 389, Chicago', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Trujillo', 'Av. Hermanos Uceda Meza N° 269, Urb. Miraflores II Etapa', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Trujillo', 'Urb. Vista Hermosa Mz. F, Lt. 11, Piso 1 (Óvalo Papal)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'El Porvenir', 'Av. Hermanos Angulo 628', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'El Porvenir', 'Av. Prolongación 12 de Noviembre, Mz. Q, Lt. 25 (Alto Trujillo)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'El Porvenir', 'Av. Las Magnolias Mz. 25, Lt. 2A, Nuevo Porvenir', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'El Porvenir', 'Jr. Cahuide N° 342, AA.HH. La Merced', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'La Esperanza', 'Av. Tahuantinsuyo N° 739', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'La Esperanza', 'Mz. 1, Lt. 23, AA.HH. Wichanzao', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Huanchaco', 'Carretera Vía de Evitamiento 576.2, Huanchaquito Alto', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Huanchaco', 'Av. Industrial Mz. 23, Lt. 13, Sector II, El Milagro', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Moche', 'Av. La Marina, Lote 25-B', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'La Libertad', 'Trujillo', 'Víctor Larco Herrera', 'Av. Larco 865', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Chiclayo', 'La Victoria', 'Av. Víctor Raúl Haya de la Torre N° 2470', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Chiclayo', 'Chiclayo', 'Av. Panamericana 975 (media cuadra del Óvalo Señor de Sipán)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Chiclayo', 'Chiclayo', 'Calle Mariscal Nieto N° 390', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Chiclayo', 'Chiclayo', 'Av. José Balta N° 3653', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Chiclayo', 'Chiclayo', 'Av. Las Américas Lt. 42, Mz. D, Urb. Monterrico I Etapa', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Chongoyape', 'Chongoyape', 'Av. Atahualpa N° 1200', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Chiclayo', 'José Leonardo Ortiz', 'Calle Tahuantinsuyo N° 995, Urb. San Lorenzo', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Monsefú', 'Monsefú', 'Av. Venezuela N° 221', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Pimentel', 'Pimentel', 'Calle Miguel Grau Mz. B, Lote 3', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Reque', 'Reque', 'Av. Mariscal Ramón Castilla Mz. 4, Lote 14', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Pátapo', 'Pátapo', 'Av. Chongoyape S/N, Sector Cerro Mirador', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Pomalca', 'Pomalca', 'Calle 25 Mz. I, Lote 6, Sector 6 San Juan', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Lambayeque', 'Tumán', 'Tumán', 'Av. El Progreso N° 52, Sector Santa Rosa', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'Ica (San Joaquín)', 'Pasaje Grau N° 101, San Joaquín', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'Ica', 'Mz. B, Sub-lote 02, Fundo La Palma (cruce Av. Cutervo con Av. J.J. Elías)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'Ica', 'Av. Manuel Santana Chiri N° 359-A1, Urb. Manzanilla', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'La Tinguiña', 'Calle Francisco Sales Sotelo N° 298, Sub Lote 3', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'Parcona', 'CP Parcona-Cercado (Primera Etapa), Mz. B, Lote 16', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'Salas', 'Panamericana Sur Km. 293.350, Salas Guadalupe', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'Santiago', 'CP Santiago, Mz. E, Lt. 01, Sector II', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Ica', 'Subtanjalla', 'CP Sector Macacona, Parcela 214, Lote 2 (Panamericana Sur)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Chincha', 'Chincha Alta', 'Prolongación Luis Massaro N° 247', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Chincha', 'Chincha Alta', 'Calle Los Ángeles N° 217, 01-A, Cercado', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Chincha', 'Pueblo Nuevo', 'AA.HH. Los Álamos, Calle Los Laureles Mz. 17, Lt. 11-A', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Chincha', 'Sunampe', 'Panamericana Sur N° 198-B', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Nazca', 'Nazca', 'Esquina Av. Circunvalación con Calle Las Mercedes S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'San Juan de Marcona', 'Marcona', 'AA.HH. San Martín de Porres E-4 (cruce Av. Las Orquídeas con Av. San Martín)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Nazca', 'Vista Alegre', 'Carretera Panamericana Sur N° 906', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Pisco', 'Pisco', 'Av. Abraham Valdelomar N° 965', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Pisco', 'Pisco', 'CP Villa Los Ángeles, Mz. A, Lt. 13-B, La Villa', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ica', 'Pisco', 'San Clemente', 'Av. Los Libertadores, Grupo N° 1, Mz. 91, Lote 7A', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Tacna', 'Av. Jorge Basadre Grohmann Oeste N° 366', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Tacna', 'Av. Vigil 1636 (a una cuadra de la Plaza Grau)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Tacna', 'Calle Arias Aragüez N° 836', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Tacna', 'Av. Litoral N° 306, Para Chico', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Pocollay', 'Pueblo Tradicional Pocollay, Mz. T, Lote 01', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Ciudad Nueva', 'Ciudad Nueva Mz. 46, Lt. 12, Comité 10', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Gregorio Albarracín', 'Asoc. Villa San Francisco Mz. 94, Lt. 22', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Gregorio Albarracín', 'Asociación Las Vilcas Mz. E, Lt. 16', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Tacna', 'Tacna', 'Gregorio Albarracín', 'Promuvi Viñani, Amp. I Etapa, Mz. 574, Lt. 09', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Puno', 'Puno', 'Puno', 'Av. Costanera 211', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 6:00 p.m.'),
  ('Shalom', 'Puno', 'Juliaca', 'San Román', 'Jr. Mama Ocllo 915-B (cruce con Jr. Azángaro)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Puno', 'Juliaca', 'San Román', 'Jr. Sillustani N° 202', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Puno', 'Juliaca', 'San Román', 'Jr. Porvenir N° 228, Urb. Las Mercedes', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Puno', 'Juliaca', 'San Román', 'Av. Lampa Mz. B2, Lt. 3, Urb. Santa Adriana', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Puno', 'Juliaca', 'San Román', 'Av. Modesto Borda Mz. A, Lt. 04, Urb. Arrabal Don Julio', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Puno', 'Juliaca', 'San Román', 'Av. Independencia N° 1538, Mz. A1, Lt. 04, Urb. Horacio Zeballos', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Puno', 'Juliaca', 'San Román', 'Jr. Agustín Gamarra Mz. R1, Lt. 09, Urb. Huancané', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Cajamarca', 'Cajamarca (Barrio Santa Elena)', 'Av. Independencia N° 787', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Cajamarca', 'Cajamarca (Urb. Horacio Zevallos)', 'Jr. Emilio Barrantes Mz. X, Lote 3', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Cajamarca', 'Cajamarca (Barrio San José)', 'Jr. Chanchamayo N° 1162', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Cajamarca', 'Cajamarca (Huambocancha Baja)', 'Huambocancha Baja, Mz. A, Lote S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Jesús', 'Jesús (Huaraclla)', 'Huaraclla, Mz. A, Lote S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Baños del Inca', 'Baños del Inca', 'Jr. Cahuide N° 242', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Cajabamba', 'Cajabamba', 'Jr. Cáceres N° 211', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Celendín', 'Celendín', 'Jr. Pedro Ortiz Montoya 148', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Chota', 'Chota', 'Av. Fray José Arana N° 805', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Chilete', 'Chilete (Contumazá)', 'Jr. Santa Rosa N° 130', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 6:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Tembladera', 'Tembladera (Contumazá)', 'Jr. Bolognesi S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 6:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Cutervo', 'Cutervo', 'Av. Salomón Vílchez Murga, cuadra 9', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Bambamarca', 'Bambamarca (Hualgayoc)', 'Av. Túpac Amaru 1105', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'Jaén', 'Jaén', 'Av. Pakammuros, cuadra 6', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'San Ignacio', 'San Ignacio', 'Pasaje Tres N° 113, Urb. Santa Rosa', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Cajamarca', 'San Marcos', 'Pedro Gálvez', 'Jr. Adolfo Amorín Bueno N° 140', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 7:00 a.m. - 4:00 p.m.'),
  ('Shalom', 'Cajamarca', 'San Miguel', 'San Miguel', 'Jr. Bolognesi N° 717', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Cajamarca', 'San Pablo', 'San Pablo', 'Jr. Tnt. Lorenzo Iglesia N° 910', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'Huancayo', 'Jr. Ica N° 1143', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'Huancayo', 'Av. Evitamiento S/N, Counter N° 13 (Terminal de Bus)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'Huancayo', 'Av. Ferrocarril S/N, Counter N° 14 (Terminal Los Andes)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'Huancayo', 'Pj. San Fernando 209', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'Chilca', 'Jr. 28 de Julio N° 935', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'El Tambo', 'Av. Mariscal Castilla 2769', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'El Tambo', 'Av. Huancavelica 1201 (Pio Pata)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'El Tambo', 'Av. Circunvalación 480, T-1', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'El Tambo', 'Jr. Tarma N° 37-24 (Ciudad Universitaria)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'Pilcomayo', 'Plaza Independencia 131', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Junín', 'Huancayo', 'San Agustín', 'Carretera Central Km 7.5 S/N', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 10:00 a.m. - 2:00 p.m.'),
  ('Shalom', 'Loreto', 'Iquitos', 'Iquitos', 'Jr. Francisco Bolognesi 203-215', '+51 986 696 240', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo cerrado'),
  ('Shalom', 'Ucayali', 'Pucallpa', 'Callería', 'Jr. José Gálvez 147', '986 696 438', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'Áncash', 'Chimbote', 'Chimbote', 'Av. Enrique Meiggs N° 2457', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Áncash', 'Chimbote', 'Chimbote', 'Av. José Gálvez 791 (cerca al Puente Gálvez)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Áncash', 'Chimbote', 'Chimbote', 'Parcela N° 16757-E, Sector La Perla Tres Cabezas', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Áncash', 'Chimbote', 'Nuevo Chimbote', 'Urb. José Carlos Mariátegui Mz. R-3, Lt. 3 (Óvalo de la Familia)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Áncash', 'Chimbote', 'Nuevo Chimbote', 'Av. José Pardo Mz. K, Lt. 17 (Óvalo Las Américas)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Áncash', 'Chimbote', 'Nuevo Chimbote', 'Urb. Nicolás Garatea Mz. 100, Lt. 24', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Áncash', 'Chimbote', 'Nuevo Chimbote', 'AA.HH. Belén Mz. O, Lt. 28 (frente Grifo Doxa)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Áncash', 'Huaraz', 'Huaraz', 'Av. 27 de Noviembre Cdra. 20 S/N, Villón Bajo, Confraternidad Internacional Oeste', '945 751 284', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'Huánuco', 'Huánuco', 'Huánuco', 'Jr. Aguilar N° 872', '(062) 637265', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'Huánuco', 'Huánuco', 'Amarilis', 'Jr. Los Pinos', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'Huánuco', 'Tingo María', 'Rupa Rupa', 'Calle Rosario Central (segunda entrada de Buenos Aires)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'Ayacucho', 'Ayacucho', 'Ayacucho (Huamanga)', 'AA.HH. Complejo Artesanal T1, Lt. 1 (a una cuadra de la Puerta 2 del Terminal Terrestre)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ayacucho', 'Ayacucho', 'Carmen Alto', 'AA.HH. Carmen Alto Mz. B1, Lt. 9, Zona II Acuchimay', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ayacucho', 'Ayacucho', 'San Juan Bautista', 'Av. Venezuela N° 431, Urb. Aprovisa', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ayacucho', 'Ayacucho', 'Jesús Nazareno', 'Jr. José María Eguren 451 (cruce con Jr. Mariano Melgar)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Ayacucho', 'Huanta', 'Huanta', 'Jr. Gervasio Santillana N° 976 (cruce con Jr. Revolución)', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Apurímac', 'Abancay', 'Abancay', 'Av. Panamericana Mz. B, Lt. 05', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 8:00 p.m. | Domingo 8:00 a.m. - 5:00 p.m.'),
  ('Shalom', 'Moquegua', 'Moquegua', 'Moquegua (San Antonio)', 'Av. Santa Fortunata Mz. N5, Lt. 10, Asoc. Villa Moquegua San Antonio', '984 782 519', 'Lunes a sábado 8:00 a.m. - 7:00 p.m.'),
  ('Shalom', 'Moquegua', 'Moquegua', 'Mariscal Nieto', 'Calle Lima 190 (dos cuadras del Parque Los Héroes)', NULL, NULL),
  ('Shalom', 'Moquegua', 'Moquegua', 'Chen Chen', 'Mz. C, Lt. 24, Asociación César Vizcarra, Chen Chen', NULL, NULL),
  ('Shalom', 'Moquegua', 'Moquegua', 'Moquegua', 'Sector Quebrada Las Lechuzas, Calle N° 1, Mz. H, Lt. 04', NULL, NULL),
  ('Shalom', 'Moquegua', 'Ilo', 'Ilo', 'Jr. Callao Prolongación Mz. N, Lt. 19-A (media cuadra de Cooperativa Cuajone)', NULL, NULL),
  ('Shalom', 'Moquegua', 'Ilo', 'Ilo', 'Urb. Ciudad del Pescador, Mz. J, Lt. 18-19', NULL, NULL),
  ('Shalom', 'Moquegua', 'Ilo', 'Pacocha', 'Agrupación Familias Pueblo Nuevo, Mz. E2, Lt. Com2a, Sect. II', NULL, NULL),
  ('Shalom', 'Tumbes', 'Tumbes', 'Tumbes', 'Calle Arica 227', '941 088 590', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'San Martín', 'Tarapoto', 'Morales', 'Malecón Cumbaza S/N (altura última cuadra del Jr. Victoria Vásquez)', '(042) 584004', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'San Martín', 'Moyobamba', 'Moyobamba', 'Jr. 20 de Abril 2138', '(01) 500 7878', NULL),
  ('Shalom', 'Amazonas', 'Chachapoyas', 'Chachapoyas', 'Jr. La Unión 330', '(01) 500 7878', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Shalom', 'Pasco', 'Cerro de Pasco', 'Chaupimarca', 'Av. Circunvalación Túpac Amaru 178 (espalda del Terminal Terrestre)', '984 781 511', 'Lunes a sábado 8:00 a.m. - 7:00 p.m. | Domingo cerrado'),
  ('Olva', 'Lima', 'Lima', 'Cercado de Lima', 'Av. Simón Bolívar 1427, Cercado de Lima 15084', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00 / 09:00-19:00; Sábado 08:00-13:30 / 09:00-13:00'),
  ('Olva', 'Lima', 'Lima', 'Cercado de Lima', 'Psje. Acuña 31, Cercado de Lima 15001', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'Cercado de Lima', 'Av. Wilson (Av. Inca Garcilaso de la Vega) 1358, Cercado de Lima 15001', '(01) 714-0909', 'Lunes a Viernes 09:00-19:00; Sábado 09:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'San Borja', 'Av. Aviación 3532, San Borja 15036', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'Santiago de Surco', 'Av. El Polo 108, Santiago de Surco 15023', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'La Molina', 'Av. Coronel Pringles 548, La Molina 15024', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'La Molina', 'Centro Comercial La Fontana, Av. Javier Prado Este, tienda 1017, La Molina 15024', '(01) 714-0909', 'Lunes a Viernes 09:00-18:00; Sábado 09:00-13:00'),
  ('Olva', 'Lima', 'Lima', 'Miraflores', 'Av. Comandante Espinar 659, Miraflores 15047', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'Miraflores', 'Calle Berlín 219, Miraflores', '497-7825', 'Lunes a Sábado 08:00-18:00'),
  ('Olva', 'Lima', 'Lima', 'San Isidro', 'Av. República de Panamá 3603, San Isidro 15036', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'San Isidro', 'Calle Begonias 774, San Isidro', '221-7503', 'Lunes a Sábado 08:00-18:00'),
  ('Olva', 'Lima', 'Lima', 'Los Olivos', 'Urb. Covida, Av. Carlos Izaguirre 1006, Los Olivos 15301', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'La Victoria', 'Jirón Antonio Bazo 1280 (Gamarra), Piso 1, La Victoria 15018', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'San Luis', 'Av. del Aire 1322, San Luis 15021', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'San Juan de Miraflores', 'Av. San Juan 713, San Juan de Miraflores 15801', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'Santa Anita', 'Av. Santa Rosa 131, Santa Anita 15009', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Lima', 'Lima', 'Comas', 'Av. Universitaria 6971-6973, Comas 15314', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Callao', 'Callao', 'Callao', 'Av. Argentina 4458, Callao', '(01) 714-0909', 'Lunes a Viernes 08:00-16:00; Sábado 08:00-13:30'),
  ('Olva', 'Callao', 'Callao', 'Callao', 'Av. Sáenz Peña 1463, Callao 07001', '(01) 714-0909', NULL),
  ('Olva', 'Lima', 'Chancay', 'Chancay', 'Mariscal Cáceres 114, Chancay 15131', '951 842 650', NULL),
  ('Olva', 'Lima', 'Huaral', 'Huaral', 'Leoncio Prado 114, Huaral 15201', '(01) 494-9691', 'Lunes a Sábado 08:00-20:00'),
  ('Olva', 'Lima', 'Huaral', 'Huaral', '2 de Mayo 235, Huaral 15201', '(01) 714-0909', 'Lunes a Sábado 09:00-20:00'),
  ('Olva', 'Lima', 'Huacho', 'Huacho', 'Mariscal Castilla 117, Huacho 15136', '(01) 232-4902', 'Lunes a Viernes 08:00-21:00; Sábado 08:00-19:00'),
  ('Olva', 'Arequipa', 'Arequipa', 'Yanahuara', 'Calle Pampita Zevallos 175, Yanahuara 04013', '(054) 380038', 'Lunes a Viernes 08:30-20:30; Sábado 09:00-19:00'),
  ('Olva', 'Arequipa', 'Arequipa', 'Centro', 'Calle San José 101A, Arequipa 04001', '(054) 287811', NULL),
  ('Olva', 'Arequipa', 'Arequipa', 'Miraflores', 'Manuel Muñoz Nájar 410, Miraflores 04001', '(054) 380038', NULL),
  ('Olva', 'Arequipa', 'Arequipa', 'José Luis Bustamante y Rivero', 'Av. Daniel Alcides Carrión 269, José Luis Bustamante y Rivero 04002', '(054) 380038', 'Lunes a Viernes 09:00-18:00; Sábado 09:00-13:00'),
  ('Olva', 'Arequipa', 'Arequipa', 'Cayma', 'Av. Ejército 1025, Cayma 04014', '(054) 275336', 'Lunes a Viernes 08:30-20:00; Sábado 08:30-19:00'),
  ('Olva', 'Cusco', 'Cusco', 'Cusco', 'Av. Pardo (Paseo de los Héroes) 575, Cusco 08000', '(084) 235292', 'Lunes a Viernes 08:00-20:00; Sábado 09:00-18:30'),
  ('Olva', 'La Libertad', 'Trujillo', 'Trujillo', 'Jirón Zepita 574, Trujillo 13001', '(044) 604646', 'Lunes a Viernes 08:30-21:00; Sábado 08:30-19:00'),
  ('Olva', 'La Libertad', 'Trujillo', 'Trujillo', 'Av. Túpac Amaru 1720, Trujillo 13001', '(044) 604646', 'Lunes a Viernes 09:00-18:00; Sábado 09:00-18:00'),
  ('Olva', 'La Libertad', 'Chepén', 'Chepén', 'Exequiel Gonzales Cáceda 707, Chepén 13871', '920 501 111', NULL),
  ('Olva', 'La Libertad', 'Pacasmayo', 'Pacasmayo', 'Av. 28 de Julio, Pacasmayo 13811', '920 501 112', NULL),
  ('Olva', 'Piura', 'Piura', 'Los Ficus', 'Av. Marcavelica Mz. D2 Lt. 13, Los Ficus, Piura 20007', NULL, 'Lunes a Viernes 09:00-19:00; Sábado 09:00-14:00'),
  ('Olva', 'Piura', 'Piura', 'Piura (Centro)', 'Av. Sánchez Cerro 456, Piura 20001', NULL, 'Lunes a Viernes 08:00-22:00; Sábado 08:00-19:00'),
  ('Olva', 'Piura', 'Tambo Grande', 'Tambo Grande', 'Jr. Lima 360, Tambo Grande 20201', '959 940 268', 'Lunes a Viernes 09:30-18:30; Sábado 09:30-18:30'),
  ('Olva', 'Piura', 'Paita', 'Paita', 'Paita 20701 (dirección exacta no publicada por la fuente)', '(073) 211988', NULL),
  ('Olva', 'Piura', 'Sechura', 'Sechura', 'Av. Simón Bolívar 591, Sechura 20691', '(073) 699394', 'Lunes a Viernes 09:00-13:00 y 14:30-17:00; Sábado 09:00-12:00'),
  ('Olva', 'Piura', 'Sullana', 'Sullana', 'Calle Bolívar 489, Sullana 20101', '(073) 501937', 'Lunes a Viernes 09:00-20:00; Sábado 09:00-14:00'),
  ('Olva', 'Piura', 'Talara', 'Talara', 'Av. San Martín, Talara 20811', '944 924 003', 'Lunes a Viernes 09:00-18:30; Sábado 09:00-15:00'),
  ('Olva', 'Lambayeque', 'Chiclayo', 'Chiclayo', 'Mariscal Castilla 208, Chiclayo 14001', '(074) 208711', 'Lunes a Viernes 08:30-20:15; Sábado 09:00-20:00'),
  ('Olva', 'Ica', 'Ica', 'Ica', 'Guatemala 161, Ica 11001', '(056) 227014', 'Lunes a Sábado 08:15-22:30'),
  ('Olva', 'Ica', 'Chincha Alta', 'Chincha Alta', 'Santo Domingo 223, Chincha 11701', '(056) 261270', 'Lunes a Viernes 08:00-18:30 aprox.; Sábado 08:00-13:00'),
  ('Olva', 'Ica', 'Pisco', 'Pisco', 'Jirón Callao, Pisco 11601', '(056) 532363', 'Lunes a Sábado 09:00-17:00'),
  ('Olva', 'Tacna', 'Tacna', 'Tacna', 'Calle Bolívar 667, Tacna 23001', '(052) 246064', 'Lunes a Viernes 08:30-18:00; Sábado 09:00-14:00'),
  ('Olva', 'Puno', 'Puno', 'Puno', 'Jr. Arequipa 120, Puno 21001', '(051) 367017', NULL),
  ('Olva', 'Puno', 'Juliaca', 'Juliaca', 'Jr. 7 de Junio 116, Juliaca 21104', '(051) 330526', 'Lunes a Viernes 08:30-20:00; Sábado 08:30-18:00'),
  ('Olva', 'Cajamarca', 'Cajamarca', 'Cajamarca', 'Jr. Los Nogales 426, Cajamarca 06002', '(076) 341285', 'Lunes a Viernes 08:30-20:30; Sábado 08:30-13:00'),
  ('Olva', 'Cajamarca', 'Jaén', 'Jaén', 'San Martín 1253, Jaén 06801', '951 937 892', NULL),
  ('Olva', 'Junín', 'Huancayo', 'Centro', 'Jr. Puno 141, Huancayo', NULL, NULL),
  ('Olva', 'Junín', 'Huancayo', 'Chilca', 'Av. Huancavelica 853, Huancayo', NULL, NULL),
  ('Olva', 'Junín', 'Huancayo', 'El Tambo', 'Julio Sumar 204, Huancayo', NULL, NULL),
  ('Olva', 'Junín', 'Tarma', 'Tarma', 'Jirón Pasco 454, Tarma 12651', NULL, NULL),
  ('Olva', 'Loreto', 'Iquitos', 'Iquitos', 'Jirón Putumayo 442-468, Iquitos 16002', '(065) 232281', 'Lunes a Viernes 09:00-19:00; Sábado 09:00-17:00'),
  ('Olva', 'Ucayali', 'Pucallpa', 'Pucallpa', 'Pucallpa 25001 (calle exacta no publicada por la fuente)', '(061) 572627', 'Lunes a Sábado 08:00-18:30'),
  ('Olva', 'Áncash', 'Chimbote', 'Chimbote', 'Av. José Pardo 420, Chimbote 02803', '(043) 328872', 'Lunes a Sábado 08:30-21:00'),
  ('Olva', 'Áncash', 'Nuevo Chimbote', 'Nuevo Chimbote', 'Av. Pacífico, Mz. S3 Lt. 36, 2° piso, Nuevo Chimbote 02711', '(043) 317670', 'Lunes a Sábado 09:00-13:00 y 16:00-20:00'),
  ('Olva', 'Áncash', 'Huaraz', 'Huaraz', 'Jr. San Martín 673, Huaraz 02001', '(043) 427641', 'Lunes a Sábado 09:00-21:00'),
  ('Olva', 'Huánuco', 'Huánuco', 'Huánuco', 'Jirón Dámaso Beraún 995, Huánuco 10001', '(062) 513233', 'Lunes a Viernes 08:30-22:00; Sábado 09:00-21:00'),
  ('Olva', 'Huánuco', 'Tingo María', 'Tingo María', 'Jr. San Alejandro 264, Tingo María 10131', '(01) 714-0909', 'Lunes a Viernes 08:30-19:30; Sábado 08:30-19:00'),
  ('Olva', 'Ayacucho', 'Ayacucho', 'Ayacucho', 'Jirón Cuzco 204, Ayacucho 05003', '(066) 318310', 'Lunes a Viernes 09:00-20:30; Sábado 09:00-14:00'),
  ('Olva', 'Apurímac', 'Abancay', 'Abancay', 'Jr. Elías, Abancay 03001', NULL, 'Lunes a Viernes 08:30-13:00 y 15:00-20:00; Sábado 08:30-13:00 y 15:00-17:00'),
  ('Olva', 'Apurímac', 'Andahuaylas', 'Andahuaylas', 'Jr. Juan F. Ramos 542-574, Andahuaylas 03701', '(083) 422283', 'Lunes a Sábado 09:00-17:00'),
  ('Olva', 'Moquegua', 'Moquegua', 'Moquegua', 'Calle Lima 308, Moquegua 18001', '(053) 461743', 'Lunes a Sábado 08:00-21:00'),
  ('Olva', 'Moquegua', 'Ilo', 'Ilo', 'Jr. Callao 226-230, Ilo 18601', '(053) 482888', 'Lunes a Viernes 09:00-20:00; Sábado 09:00-12:00'),
  ('Olva', 'Tumbes', 'Tumbes', 'Tumbes', 'Av. Tumbes 293, Tumbes 24000', '972 682 693', 'Lunes a Viernes 08:30-13:00 y 14:00-19:00; Sábado 09:00-13:00 y 15:30-17:15'),
  ('Olva', 'Amazonas', 'Bagua Grande', 'Bagua Grande', 'Psje. Alfonso Ugarte 171, Bagua Grande 01721', '(041) 471302', 'Lunes a Viernes 08:00-13:00 y 15:30-20:00; Sábado 08:00-13:00 y 15:30-20:00'),
  ('Olva', 'Pasco', 'Cerro de Pasco', 'Cerro de Pasco', 'Pasaje Agustín Gamarra 103, Cerro de Pasco 19001', '(063) 421795', 'Lunes a Sábado 09:00-20:00'),
  ('Olva', 'Huancavelica', 'Huancavelica', 'Huancavelica', 'Jirón Agustín Gamarra 316, Huancavelica 09001', '(067) 452546', NULL),
  ('Olva', 'San Martín', 'Tarapoto', 'Tarapoto', 'Jr. Jiménez Pimentel 197, Tarapoto 22202', '(042) 521456', 'Lunes a Viernes 09:00-18:30; Sábado 09:00-13:30'),
  ('Olva', 'San Martín', 'Juanjuí', 'Juanjuí', 'Juanjuí 22001 (calle exacta no publicada por la fuente)', '951 860 342', 'Lunes a Viernes 08:00-13:00 y 15:00-19:00; Sábado 08:00-13:00 y 15:00-19:00'),
  ('Olva', 'Madre de Dios', 'Puerto Maldonado', 'Puerto Maldonado', 'Av. León Velarde 770, Puerto Maldonado 17001', '(082) 350958', 'Lunes a Viernes 08:00-13:00 y 15:00-20:00; Sábado 09:00-15:30')
ON CONFLICT DO NOTHING;

-- 5. CATEGORÍAS ---------------------------------------------------------------
INSERT INTO categories (name) VALUES
  ('General'),
  ('Aretes'),
  ('Conjuntos'),
  ('Collares'),
  ('Pulseras'),
  ('Anillos')
ON CONFLICT DO NOTHING;

-- 6. PRODUCTOS (47) ------------------------------------------------------------
INSERT INTO products (id, sku, name, category, price, stock, min_stock, location, updated_at) VALUES
  ('prod-art-001', 'OBS-ART-01', 'Aretes Esfera', 'Aretes', 49, 15, 5, 'Exhibidor Aretes - Plata 950', '2026-10-07T00:50:37.262Z'::timestamptz),
  ('prod-art-002', 'OBS-ART-02', 'Aretes Conchita', 'Aretes', 59, 12, 4, 'Exhibidor Aretes - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-art-003', 'OBS-ART-03', 'Aretes Corazón Liso', 'Aretes', 39, 20, 5, 'Exhibidor Aretes - Plata 950', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-art-004', 'OBS-ART-04', 'Aretes Flor Rosa', 'Aretes', 39, 18, 5, 'Exhibidor Aretes - Plata 950', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-art-005', 'OBS-ART-05', 'Aretes Corazón Rosa (Plata P50)', 'Aretes', 49, 10, 3, 'Exhibidor Aretes - Plata P50', '2026-10-05T00:50:37.272Z'::timestamptz),
  ('prod-art-006', 'OBS-ART-06', 'Aretes Corazón Circón', 'Aretes', 49, 14, 4, 'Exhibidor Aretes - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-art-007', 'OBS-ART-07', 'Aretes Corazón Perla', 'Aretes', 49, 8, 3, 'Exhibidor Aretes - Plata 950', '2026-10-04T00:50:37.272Z'::timestamptz),
  ('prod-art-008', 'OBS-ART-08', 'Aretes Flor Perla', 'Aretes', 49, 16, 4, 'Exhibidor Aretes - Plata 950', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-art-009', 'OBS-ART-09', 'Aretes Estrella de Mar', 'Aretes', 59, 12, 4, 'Exhibidor Aretes - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-art-010', 'OBS-ART-10', 'Aretes Pastilla', 'Aretes', 49, 15, 5, 'Exhibidor Aretes - Plata 950', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-art-011', 'OBS-ART-11', 'Aretes Triqueta', 'Aretes', 59, 9, 3, 'Exhibidor Aretes - Plata 925', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-art-012', 'OBS-ART-12', 'Aretes Brillantes', 'Aretes', 49, 11, 4, 'Exhibidor Aretes - Plata 925', '2026-10-05T00:50:37.272Z'::timestamptz),
  ('prod-art-013', 'OBS-ART-13', 'Aretes Huella', 'Aretes', 59, 10, 3, 'Exhibidor Aretes - Plata 925', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-art-014', 'OBS-ART-14', 'Aretes Búho', 'Aretes', 59, 7, 3, 'Exhibidor Aretes - Plata 925', '2026-10-04T00:50:37.272Z'::timestamptz),
  ('prod-art-015', 'OBS-ART-15', 'Argolla Entrochada', 'Aretes', 69, 14, 5, 'Exhibidor Aretes - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-art-016', 'OBS-ART-16', 'Argolla Lisa', 'Aretes', 69, 18, 5, 'Exhibidor Aretes - Plata 950', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-art-017', 'OBS-ART-17', 'Aretes Rombos', 'Aretes', 59, 0, 4, 'Exhibidor Aretes - Plata 925', '2026-10-03T00:50:37.272Z'::timestamptz),
  ('prod-cnj-001', 'OBS-CNJ-01', 'Conjunto Aros (Aretes + Cadena Cola de Ratón 45cm)', 'Conjuntos', 89, 8, 3, 'Exhibidor Conjuntos - Plata 925', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-cnj-002', 'OBS-CNJ-02', 'Conjunto Perla Circón (Aretes + Dije + Cadena 45cm)', 'Conjuntos', 89, 10, 3, 'Exhibidor Conjuntos - Plata 925', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-cnj-003', 'OBS-CNJ-03', 'Conjunto Corazón Verde (Aretes + Cadena Cola de Ratón 45cm)', 'Conjuntos', 99, 6, 2, 'Exhibidor Conjuntos - Plata 925', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-cnj-004', 'OBS-CNJ-04', 'Conjunto Mandala (Aretes + Cadena Cola de Ratón 45cm)', 'Conjuntos', 89, 9, 3, 'Exhibidor Conjuntos - Plata 925', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-col-001', 'OBS-COL-01', 'Collar Nudo de Bruja (Dije Plata 950 + Cadena Soga 45cm)', 'Collares', 89, 12, 4, 'Exhibidor Collares - Plata 950', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-col-002', 'OBS-COL-02', 'Collar Flor de Loto (Dije Plata 950 + Cadena Pancer 45cm)', 'Collares', 89, 15, 5, 'Exhibidor Collares - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-col-003', 'OBS-COL-03', 'Collar Girasol (Dije Plata 950 + Cadena Pancer 45cm)', 'Collares', 89, 11, 4, 'Exhibidor Collares - Plata 950', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-col-004', 'OBS-COL-04', 'Collar Flor Andina (Dije Plata 950 + Cadena Pancer 45cm)', 'Collares', 89, 10, 3, 'Exhibidor Collares - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-col-005', 'OBS-COL-05', 'Collar Corazón Amazonita (Dije Plata 950 Piedra Natural)', 'Collares', 89, 8, 3, 'Exhibidor Collares - Piedras Naturales', '2026-10-05T00:50:37.272Z'::timestamptz),
  ('prod-col-006', 'OBS-COL-06', 'Collar Obsidiana (Dije Plata 950 Piedra Natural + Cadena)', 'Collares', 89, 20, 5, 'Exhibidor Collares - Piedras Naturales', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-col-007', 'OBS-COL-07', 'Collar Amatista (Dije Plata 950 Piedra Natural + Cadena)', 'Collares', 89, 9, 3, 'Exhibidor Collares - Piedras Naturales', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-col-008', 'OBS-COL-08', 'Collar Flor Cosmos (Dije Plata 950 + Cadena Pancer 45cm)', 'Collares', 89, 14, 4, 'Exhibidor Collares - Plata 950', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-col-009', 'OBS-COL-09', 'Collar Trébol (Dije Plata 925 + Cadena Pancer 45cm)', 'Collares', 89, 13, 4, 'Exhibidor Collares - Plata 925', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-col-010', 'OBS-COL-10', 'Collar Corazón Diamantado (Dije Plata 925 + Cadena)', 'Collares', 79, 16, 5, 'Exhibidor Collares - Plata 925', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-col-011', 'OBS-COL-11', 'Collar Estrella de Mar (Dije Plata 950 + Cadena Pancer)', 'Collares', 79, 12, 4, 'Exhibidor Collares - Plata 950', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-col-012', 'OBS-COL-12', 'Collar Estrella Lisa (Dije Plata 950 + Cadena Cola de Ratón)', 'Collares', 79, 10, 3, 'Exhibidor Collares - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-col-013', 'OBS-COL-13', 'Collar Cruz Andina (Dije Plata 925 + Cadena Pancer 45cm)', 'Collares', 79, 15, 5, 'Exhibidor Collares - Plata 925', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-col-014', 'OBS-COL-14', 'Collar Hoja Arce (Dije Plata 925 + Cadena Pancer 45cm)', 'Collares', 79, 7, 3, 'Exhibidor Collares - Plata 925', '2026-10-05T00:50:37.272Z'::timestamptz),
  ('prod-col-015', 'OBS-COL-15', 'Collar Satelital (Plata 950, 45 cm)', 'Collares', 65, 18, 5, 'Exhibidor Collares - Plata 950', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-pul-001', 'OBS-PUL-01', 'Pulsera Corazón Rojo (Plata 925, Regulable)', 'Pulseras', 59, 12, 4, 'Exhibidor Pulseras - Plata 925', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-pul-002', 'OBS-PUL-02', 'Pulsera Trébol Brillante (Plata 925, Regulable)', 'Pulseras', 59, 14, 4, 'Exhibidor Pulseras - Plata 925', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-pul-003', 'OBS-PUL-03', 'Pulsera Tres Lazos (Plata 925, Regulable)', 'Pulseras', 55, 10, 3, 'Exhibidor Pulseras - Plata 925', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-pul-004', 'OBS-PUL-04', 'Pulsera Doble Corazones (Plata 925, Regulable)', 'Pulseras', 55, 9, 3, 'Exhibidor Pulseras - Plata 925', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-pul-005', 'OBS-PUL-05', 'Pulsera Eslabones Finos (Gucci, Entorchada y Pancer Plata 950)', 'Pulseras', 49, 15, 5, 'Exhibidor Pulseras - Plata 950', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-pul-006', 'OBS-PUL-06', 'Pulsera Eclipse (Plata 925)', 'Pulseras', 55, 8, 3, 'Exhibidor Pulseras - Plata 925', '2026-10-05T00:50:37.272Z'::timestamptz),
  ('prod-anl-001', 'OBS-ANL-01', 'Anillo Margarita (Plata 950)', 'Anillos', 49, 11, 4, 'Exhibidor Anillos - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-anl-002', 'OBS-ANL-02', 'Anillo Eslabones (Plata 925)', 'Anillos', 39, 14, 4, 'Exhibidor Anillos - Plata 925', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('prod-anl-003', 'OBS-ANL-03', 'Anillo Órbita (Plata 950)', 'Anillos', 39, 12, 4, 'Exhibidor Anillos - Plata 950', '2026-10-06T00:50:37.272Z'::timestamptz),
  ('prod-anl-004', 'OBS-ANL-04', 'Anillo Infinito (Plata 950)', 'Anillos', 39, 16, 5, 'Exhibidor Anillos - Plata 950', '2026-10-07T00:50:37.272Z'::timestamptz),
  ('prod-anl-005', 'OBS-ANL-05', 'Anillo Corazón Circón (Plata 950 - Variantes Color)', 'Anillos', 39, 20, 6, 'Exhibidor Anillos - Plata 950', '2026-10-08T00:50:37.272Z'::timestamptz)
ON CONFLICT DO NOTHING;

-- 7. PEDIDOS DEMO (3) ---------------------------------------------------------
-- PED-2026-0091 · Camila Alarcón Sotomayor
INSERT INTO orders (id, order_number, tracking_code, customer_name, customer_email, customer_phone, customer_doc,
  customer_address, customer_reference, customer_province, customer_district, customer_zone, customer_notes,
  customer_lat, customer_lng, subtotal, shipping_fee, discount, total, status, payment_method, estimated_delivery,
  courier_driver_name, courier_driver_phone, courier_vehicle, courier_license_plate, created_at, updated_at)
VALUES ('ord-1001', 'PED-2026-0091', 'TRK-98412', 'Camila Alarcón Sotomayor', 'camila.alarcon@gmail.com', '+51 987 654 321', NULL, 'Av. Larco 742, Depto 502', NULL, 'Lima', 'Miraflores', 'Lima Moderna & Residencial', 'Llamar al llegar, dejar con el conserje si no responde', NULL, NULL, 178, 12.5, 0, 190.5, 'en_ruta'::order_status, 'Transferencia BCP / Yape', 'Hoy antes de las 6:00 PM', 'Jorge Mendoza Paredes', '+51 912 345 678', 'Motorizado Obsidiana Express', 'MC-7890', '2026-10-08T00:50:37.272Z'::timestamptz, '2026-10-08T21:50:37.272Z'::timestamptz)
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, sku, material, quantity, unit_price)
SELECT v.* FROM (VALUES
  ('ord-1001', 'prod-col-006', 'Collar Obsidiana (Dije Plata 950 Piedra Natural + Cadena)', 'OBS-COL-06', NULL::text, 1::int, 89::numeric),
  ('ord-1001', 'prod-cnj-001', 'Conjunto Aros (Aretes + Cadena Cola de Ratón 45cm)', 'OBS-CNJ-01', NULL::text, 1::int, 89::numeric)
) AS v(order_id, product_id, product_name, sku, material, quantity, unit_price)
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ord-1001');
INSERT INTO order_timeline (order_id, step_order, status, title, description, location, completed, occurred_at) VALUES
  ('ord-1001', 1, 'pendiente', 'Pedido Registrado', 'Pedido ingresado en el sistema Obsidiana Joyería', 'Taller Central Obsidiana Lima', true, '2026-10-08T00:50:37.272Z'::timestamptz),
  ('ord-1001', 2, 'en_preparacion', 'Empaquetado de Joyas en Caja de Regalo', 'Joyas empacadas en estuche aterciopelado con certificado de autenticidad Plata 950', 'Almacén Obsidiana Miraflores', true, '2026-10-08T06:50:37.272Z'::timestamptz),
  ('ord-1001', 3, 'en_ruta', 'En Camino a Dirección de Entrega', 'Asignado a repartidor Jorge Mendoza - En ruta a Miraflores', 'En Ruta - Lima Moderna', true, '2026-10-08T21:50:37.272Z'::timestamptz),
  ('ord-1001', 4, 'entregado', 'Entrega Completada', 'Recepción firmada por el cliente', 'Av. Larco 742, Miraflores', false, NULL)
ON CONFLICT DO NOTHING;

-- PED-2026-0092 · Gonzalo Benavides Vega
INSERT INTO orders (id, order_number, tracking_code, customer_name, customer_email, customer_phone, customer_doc,
  customer_address, customer_reference, customer_province, customer_district, customer_zone, customer_notes,
  customer_lat, customer_lng, subtotal, shipping_fee, discount, total, status, payment_method, estimated_delivery,
  courier_driver_name, courier_driver_phone, courier_vehicle, courier_license_plate, created_at, updated_at)
VALUES ('ord-1002', 'PED-2026-0092', 'TRK-88104', 'Gonzalo Benavides Vega', 'gonzalo.benavides@empresa.pe', '+51 955 123 987', NULL, 'Calle Valle Riestra 320', NULL, 'Arequipa', 'Cayma', 'Arequipa Metropolitana', 'Empaque de regalo especial de aniversario', NULL, NULL, 168, 22, 0, 190, 'en_preparacion'::order_status, 'Tarjeta de Crédito Visa', '31 de Julio (En 2 días)', 'Arequipa Cargo Express', NULL, 'Camión Interprovincial R3', 'V4B-910', '2026-10-08T16:50:37.272Z'::timestamptz, '2026-10-08T22:50:37.272Z'::timestamptz)
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, sku, material, quantity, unit_price)
SELECT v.* FROM (VALUES
  ('ord-1002', 'prod-cnj-003', 'Conjunto Corazón Verde (Aretes + Cadena Cola de Ratón 45cm)', 'OBS-CNJ-03', NULL::text, 1::int, 99::numeric),
  ('ord-1002', 'prod-art-015', 'Argolla Entrochada (Plata 950)', 'OBS-ART-15', NULL::text, 1::int, 69::numeric)
) AS v(order_id, product_id, product_name, sku, material, quantity, unit_price)
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ord-1002');
INSERT INTO order_timeline (order_id, step_order, status, title, description, location, completed, occurred_at) VALUES
  ('ord-1002', 1, 'pendiente', 'Pedido Registrado', 'Pago recibido correctamente con Tarjeta Visa', 'Sistema Central Obsidiana', true, '2026-10-08T16:50:37.272Z'::timestamptz),
  ('ord-1002', 2, 'en_preparacion', 'Inspección de Calidad de Joyas', 'Verificando acabados de Plata 925 y grabado para envío a provincia', 'Taller de Joyería Obsidiana', true, '2026-10-08T22:50:37.272Z'::timestamptz),
  ('ord-1002', 3, 'en_ruta', 'Despacho Interprovincial', 'Enviado a courier Arequipa Cargo', 'Agencia Cargo Lima - Arequipa', false, NULL),
  ('ord-1002', 4, 'entregado', 'Entrega en Cayma, Arequipa', 'Entrega final', 'Cayma, Arequipa', false, NULL)
ON CONFLICT DO NOTHING;

-- PED-2026-0090 · Lucía Morales Prado
INSERT INTO orders (id, order_number, tracking_code, customer_name, customer_email, customer_phone, customer_doc,
  customer_address, customer_reference, customer_province, customer_district, customer_zone, customer_notes,
  customer_lat, customer_lng, subtotal, shipping_fee, discount, total, status, payment_method, estimated_delivery,
  courier_driver_name, courier_driver_phone, courier_vehicle, courier_license_plate, created_at, updated_at)
VALUES ('ord-1003', 'PED-2026-0090', 'TRK-77192', 'Lucía Morales Prado', 'lucia.morales@hotmail.com', '+51 941 882 110', NULL, 'Jr. Carabaya 450, Of. 301', NULL, 'Lima', 'Cercado de Lima', 'Lima Centro Express', NULL, NULL, NULL, 148, 10, 0, 158, 'entregado'::order_status, 'Pago Contraentrega (Yape)', 'Completado', 'Carlos Ruiz Alva', '+51 977 112 334', 'Motorizado Obsidiana Express', 'MC-4512', '2026-10-07T00:50:37.272Z'::timestamptz, '2026-10-08T00:50:37.272Z'::timestamptz)
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, sku, material, quantity, unit_price)
SELECT v.* FROM (VALUES
  ('ord-1003', 'prod-col-001', 'Collar Nudo de Bruja (Dije Plata 950 + Cadena Soga 45cm)', 'OBS-COL-01', NULL::text, 1::int, 89::numeric),
  ('ord-1003', 'prod-pul-001', 'Pulsera Corazón Rojo (Plata 925, Regulable)', 'OBS-PUL-01', NULL::text, 1::int, 59::numeric)
) AS v(order_id, product_id, product_name, sku, material, quantity, unit_price)
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ord-1003');
INSERT INTO order_timeline (order_id, step_order, status, title, description, location, completed, occurred_at) VALUES
  ('ord-1003', 1, 'pendiente', 'Pedido Registrado', 'Pedido tomado para entrega en Lima Centro', 'Obsidiana Central', true, '2026-10-07T00:50:37.272Z'::timestamptz),
  ('ord-1003', 2, 'en_preparacion', 'Preparado y Empacado', 'Listo para despacho motorizado', 'Almacén Obsidiana', true, '2026-10-07T05:38:37.272Z'::timestamptz),
  ('ord-1003', 3, 'en_ruta', 'Motorizado en Camino', 'Motorizado Carlos Ruiz en ruta', 'En Ruta Centro de Lima', true, '2026-10-07T20:02:37.272Z'::timestamptz),
  ('ord-1003', 4, 'entregado', 'Entregado Satisfactoriamente', 'Entregado a Lucía Morales. Pago verificado por Yape.', 'Jr. Carabaya 450, Of. 301, Cercado de Lima', true, '2026-10-08T00:50:37.272Z'::timestamptz)
ON CONFLICT DO NOTHING;

-- 8. MOVIMIENTOS DE STOCK (3) -------------------------------------------------
INSERT INTO stock_movements (id, product_id, product_name, type, quantity, reason, performed_by, created_at) VALUES
  ('mov-01', 'prod-col-006', 'Collar Obsidiana (Dije Plata 950 Piedra Natural + Cadena)', 'out'::stock_movement_type, 1, 'Venta realizada - Pedido PED-2026-0091', 'Sistema de Pedidos', '2026-10-08T00:50:37.272Z'::timestamptz),
  ('mov-02', 'prod-cnj-003', 'Conjunto Corazón Verde (Aretes + Cadena Cola de Ratón 45cm)', 'out'::stock_movement_type, 1, 'Venta realizada - Pedido PED-2026-0092', 'Sistema de Pedidos', '2026-10-08T16:50:37.272Z'::timestamptz),
  ('mov-03', 'prod-art-001', 'Aretes Esfera', 'in'::stock_movement_type, 15, 'Ingreso inicial de producción de taller de joyería', 'Administrador de Taller', '2026-10-06T00:50:37.272Z'::timestamptz)
ON CONFLICT DO NOTHING;

-- 9. HISTORIAL DE CORREOS (2) -------------------------------------------------
INSERT INTO email_logs (id, order_id, tracking_code, recipient_email, recipient_name, subject, template_type, status, body_html, sent_at) VALUES
  ('email-1', 'ord-1001', 'TRK-98412', 'camila.alarcon@gmail.com', 'Camila Alarcón Sotomayor', '¡Tu pedido PED-2026-0091 ya está en camino! 🚚', 'order_dispatched'::email_template_type, 'sent'::email_status, '<div style="font-family: sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
      <h2 style="color: #2563eb;">¡Hola Camila! Tu pedido está en ruta</h2>
      <p>Nos alegra informarte que tu pedido <strong>PED-2026-0091</strong> con código de seguimiento <strong>TRK-98412</strong> ha sido despachado y se encuentra en camino a Miraflores.</p>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Repartidor asignado:</strong> Jorge Mendoza Paredes (+51 912 345 678)</p>
        <p style="margin: 0 0 8px 0;"><strong>Dirección:</strong> Av. Larco 742, Depto 502, Miraflores, Lima</p>
        <p style="margin: 0;"><strong>Tiempo estimado de llegada:</strong> Hoy antes de las 6:00 PM</p>
      </div>
      <p>Puedes rastrear el estado en vivo de tu envío con el código <strong>TRK-98412</strong>.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Sistema de Envíos Logísticos Perú - Mensaje Automático</p>
    </div>', '2026-10-08T21:50:37.272Z'::timestamptz),
  ('email-2', 'ord-1002', 'TRK-88104', 'gonzalo.benavides@empresa.pe', 'Gonzalo Benavides Vega', 'Confirmación de Pedido PED-2026-0092 - En Preparación 📦', 'order_created'::email_template_type, 'sent'::email_status, '<div style="font-family: sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
      <h2 style="color: #2563eb;">¡Gracias por tu compra, Gonzalo!</h2>
      <p>Hemos recibido tu pedido <strong>PED-2026-0092</strong> con éxito. Nuestro equipo de almacén se encuentra preparando tus productos para el envío a Arequipa.</p>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Código de Rastreo:</strong> TRK-88104</p>
        <p style="margin: 0 0 8px 0;"><strong>Total Pagado:</strong> S/ 1,522.00</p>
        <p style="margin: 0;"><strong>Destino:</strong> Cayma, Arequipa (Arequipa Metropolitana)</p>
      </div>
      <p>Te enviaremos una notificación por correo cuando tu paquete sea despachado.</p>
    </div>', '2026-10-08T16:50:37.272Z'::timestamptz)
ON CONFLICT DO NOTHING;

-- 10. PLANTILLAS DE CORREO ----------------------------------------------------
INSERT INTO email_templates (type, title, subject, content) VALUES
  ('order_created'::email_template_type, 'Pedido registrado', '¡Confirmación de Pedido {{order_number}}! Código de Tracking: {{tracking_code}}', 'Hola {{customer_name}}, hemos recibido tu pedido {{order_number}}. Código de tracking: {{tracking_code}}. Total: S/ {{total}}.'),
  ('order_dispatched'::email_template_type, 'Pedido en preparación', 'Actualización de tu pedido {{order_number}}', 'Hola {{customer_name}}, tu pedido {{order_number}} está siendo preparado y empacado.'),
  ('out_for_delivery'::email_template_type, 'Pedido en camino', '🚚 Tu pedido {{order_number}} está en camino - Tracking: {{tracking_code}}', 'Hola {{customer_name}}, tu pedido {{order_number}} ya está en ruta hacia {{address}}.'),
  ('delivered'::email_template_type, 'Pedido entregado', '🎉 ¡Tu pedido {{order_number}} ha sido entregado con éxito!', 'Hola {{customer_name}}, confirmamos la entrega de tu pedido {{order_number}}. ¡Gracias por elegir Obsidiana!'),
  ('low_stock_alert'::email_template_type, 'Alerta de stock bajo', '⚠ Stock bajo: {{product_name}} ({{stock}} unidades)', 'El producto {{product_name}} (SKU {{sku}}) tiene {{stock}} unidades; el mínimo es {{min_stock}}.')
ON CONFLICT (type) DO NOTHING;

-- 11. SINCRONIZAR NUMERACIÓN DE PEDIDOS ---------------------------------------
SELECT setval('order_number_seq',
  GREATEST(92, COALESCE((SELECT max(substring(order_number FROM '(\d+)$')::int) FROM orders), 92)));

COMMIT;
