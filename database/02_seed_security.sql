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
