# Guía de Base de Datos - Obsidiana Store (Supabase)

**URL del Proyecto:** `https://odjofatvoxrpiebwgwqj.supabase.co`  
**Panel Directo de SQL:** [Supabase SQL Editor](https://supabase.com/dashboard/project/odjofatvoxrpiebwgwqj/sql/new)

---

## 🚀 Cómo Ejecutar en Supabase (1 Solo Paso)

1. Abre tu navegador e ingresa a:  
   👉 **https://supabase.com/dashboard/project/odjofatvoxrpiebwgwqj/sql/new**
2. Abre el archivo [`database/00_FULL_SETUP.sql`](file:///d:/obsidiana-store/database/00_FULL_SETUP.sql).
3. Copia todo su contenido, pégalo en el editor de Supabase y haz clic en **RUN** (o presiona `Ctrl + Enter`).
4. ¡Listo! Todo el sistema quedará desplegado: tablas, funciones, usuarios, catálogo y seguridad.

*(Si prefieres ejecutarlo en partes, ejecuta en orden: `01_schema.sql` ➔ `02_seed_security.sql` ➔ `03_seed_data.sql`)*.

---

## 👥 Usuarios y Niveles de Acceso Creados

| Rol | Nivel | Email | Clave Inicial | Acceso |
| :--- | :---: | :--- | :--- | :--- |
| **OWNER** | 100 | `valentino@obsidiana.com` | `30092023` | **Acceso total a todo el sistema**, gestión de usuarios, auditoría, configuración y reinicio de datos. |
| **ADMIN** | 50 | `ruben@obsidiana.com` | `3009202620` | **Acceso operativo bajo el OWNER**: Punto de venta, pedidos, inventario, entradas/salidas de stock, zonas de envío, tracking y reportes. *Restringido:* no puede borrar usuarios, ni crear otros administradores, ni ver auditoría, ni reiniciar el sistema. |

> **Seguridad:** Las contraseñas se almacenan mediante **bcrypt** (`crypt(..., gen_salt('bf', 10))`). Nunca se guardan en texto plano.

---

## 📦 Estructura del Esquema Creado

1. **Seguridad & Roles:**
   - `roles`: OWNER (100) y ADMIN (50).
   - `permissions`: 24 permisos granulares por módulo (`pos`, `orders`, `inventory`, `shipping`, `tracking`, `reports`, `emails`, `users`, `system`).
   - `role_permissions`: Mapeo de permisos por rol.
   - `users`: Usuarios, estados, bloqueos por intentos fallidos, timestamps.
   - `user_sessions`: Sesiones activas con hash de token y expiración.
   - `audit_log`: Bitácora inmutable de auditoría para cambios sensibles.

2. **Inventario & Stock:**
   - `categories`: Categorías (Aretes, Pulseras, Collares, Anillos, Conjuntos, etc.).
   - `products`: Catálogo con SKU único, precio, stock, stock mínimo, ubicación en almacén.
   - `stock_movements`: Kardex con historial de entradas, salidas y ajustes, auditando quién lo realizó y el stock antes/después.
   - **Triggers automáticos:**
     - Al vender un producto en un pedido, se descuenta stock y se genera el movimiento `'out'`.
     - Si el pedido se cancela, el trigger restaura el stock y genera el movimiento `'in'`.
     - Protección contra sobreventa a nivel de base de datos (`stock < quantity` lanza excepción).

3. **Geografía & Envíos:**
   - `provinces`: Provincias registradas (Lima, Arequipa, La Libertad, Cusco, Piura).
   - `zones`: Zonas logísticas con tarifa de envío, tiempo estimado y courier asignado.
   - `districts`: Distritos vinculados a su provincia y zona logística.
   - `shipping_agencies`: **387 agencias** verificadas a nivel nacional de **Shalom** y **Olva Courier**.

4. **Pedidos & POS:**
   - `orders`: Pedidos con numeración correlativa (`PED-2026-0093...`), código de seguimiento único (`TRK-XXXXX`), datos de cliente, totales y coordenadas.
   - `order_items`: Ítems del pedido con producto, cantidad, precio unitario y material (Plata 950 / 925).
   - `order_timeline`: Pasos de seguimiento (Registrado, En preparación, En ruta, Entregado).
   - `sale_receipts`: Comprobantes y notas de venta emitidos desde el Punto de Venta (POS).

5. **Notificaciones por Correo:**
   - `email_templates`: Plantillas HTML y texto para eventos de pedido y alertas de stock bajo.
   - `email_logs`: Historial auditable de correos emitidos con tracking code y destinatario.

6. **Vistas de Analítica & Reportes:**
   - `v_users`: Listado de usuarios con roles y último acceso.
   - `v_low_stock_products`: Productos con stock por debajo del mínimo.
   - `v_system_stats`: KPIs en tiempo real (pedidos, ventas totales, pendientes, tasa de entrega).
   - `v_sales_daily`: Ventas agrupadas por fecha.
   - `v_sales_by_category`: Ventas y unidades por categoría de joya.
   - `v_top_products`: Ranking de productos más vendidos.
   - `v_sales_by_zone`: Distribución de ventas por zona y provincia.

---

## 🔐 Funciones Transaccionales Seguras (RPC)

- `fn_login(p_email, p_password)`: Valida credenciales, bloquea tras 5 intentos fallidos y retorna el perfil con sus permisos.
- `fn_adjust_stock(...)`: Ajusta inventario respetando permisos y registrando auditoría.
- `fn_create_user(...)`: Crea nuevos usuarios validando jerarquía (ADMIN no puede crear OWNER ni otro ADMIN).
- `fn_change_password(...)`: Permite cambiar contraseña verificando la anterior o por un superior.
- `fn_protect_last_owner()`: Trigger que impide eliminar o degradar al último OWNER del sistema.
