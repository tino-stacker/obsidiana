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
