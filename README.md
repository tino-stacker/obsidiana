# Obsidiana Joyería — Sistema de Gestión POS, Catálogo & Envíos (obs-store)

Sistema integral de punto de venta (POS), catálogo virtual público, trazabilidad de envíos por motorizado y agencias nacionales (Shalom Express), kardex de inventario y notificaciones automáticas para **Obsidiana Joyería Perú**.

---

## 🏛️ 1. Arquitectura del Proyecto

El proyecto está diseñado bajo un enfoque **modular guiado por dominios (Domain-Driven Feature Modules)** con capas limpias:
- **Presentación (UI Components):** Componentes visuales desacoplados, micro-componentes y plantillas SVG independientes.
- **Lógica de Negocio (Domain Logic):** Validaciones de inventario, cálculo de adelantos/saldos, generación de hojas de ruta de despacho.
- **Acceso a Datos (Services):** Servicios de dominio (`productsService`, `ordersService`, `clientsService`, `shippingService`) con persistencia en Supabase y respaldo automático a memoria/mock offline.
- **Hubs de Compatibilidad (`src/lib/services.ts`, `src/components/*`):** Re-exportan módulos sin romper referencias existentes.

```
obs-store/
├── src/
│   ├── modules/                     # 📂 Módulos de funcionalidad por dominio
│   │   ├── auth/                    # Autenticación y pantallas de acceso
│   │   │   └── components/          # LoginScreen, etc.
│   │   ├── products/                # Catálogo de joyas, kardex e inventario
│   │   │   ├── components/          # InventoryModule, InventoryKpiCards, StockMovementsTable
│   │   │   └── services/            # productsService (CRUD & stock updates)
│   │   ├── orders/                  # Gestión de pedidos, notas de venta y tracking
│   │   │   ├── components/          # OrderDetailModal, OrderActionModals, OrderDetailPrintableReceipt
│   │   │   └── services/            # ordersService (Estados, historial, borrado seguro)
│   │   ├── pos/                     # Terminal Punto de Venta (Caja rápida)
│   │   │   └── components/          # PosModule, PosReceiptModal, PosBrandIcons
│   │   ├── shipping/                # Logística y agencias (Lima & Shalom Provincia)
│   │   │   └── services/            # shippingService (Zonas, tarifas, distritos)
│   │   ├── clients/                 # Directorio de clientes y compras frecuentes
│   │   │   └── services/            # clientsService (Búsqueda por DNI/RUC/teléfono)
│   │   └── notifications/           # Notificaciones multicanal (Email & WhatsApp)
│   │       └── templates/           # orderEmailHtml (HTML responsivo para correos)
│   ├── components/                  # Componentes globales y adaptadores backward-compatible
│   ├── lib/                         # Clientes compartidos (supabase, printHelper, services)
│   ├── types.ts                     # Definiciones de tipos TypeScript fuertemente tipados
│   └── App.tsx                      # Orquestador principal con lazy loading & Suspense
├── server/                          # 📂 Backend API Express modularizado
│   ├── routes/                      # api.ts (Endpoints /api REST)
│   ├── services/                    # mailer.ts (Nodemailer seguro), logistics.ts
│   └── mockDb.ts                    # Estado en memoria para desarrollo offline
├── supabase/                        # 📂 Esquema y Migraciones de Base de Datos
│   └── migrations/                  # Migraciones versionadas (20261001_*, 20261002_*, etc.)
├── scripts/                         # 📂 Scripts organizados de mantenimiento y datos
│   ├── data/                        # seed-zonas, sync_47_products, process_shalom
│   ├── images/                      # crop, process_photos, process_hover_photos
│   └── maintenance/                 # Scripts auxiliares de refactorización
└── server.ts                        # Punto de entrada HTTP del servidor Node/Express
```

---

## ⚡ 2. Rendimiento y Carga Optimizada (Evidencia)

Se implementó **Code Splitting con dynamic imports (`React.lazy` + `React.Suspense`)** y **separación de vendor chunks** en `vite.config.ts`.

| Métrica | Antes de la Reorganización | Después de la Reorganización | Mejora |
|---|---|---|---|
| **Bundle Inicial Principal** | `1,389.08 kB` | `663.07 kB` | **-52.3% reducción** |
| **Librería de Gráficos (`recharts`)** | Empaquetada en carga inicial | Chunk diferido (`vendor-charts`: 409 kB) | Solo se descarga al abrir Reportes |
| **Cliente Supabase** | Empaquetado monolíticamente | Chunk en caché (`vendor-supabase`: 219 kB) | Cacheable permanentemente |
| **Catálogo Público / Clientes / Tracking** | Bloqueaban render inicial | Chunks individuales de 7 a 14 kB | Carga bajo demanda instantánea |

---

## 🔒 3. Seguridad y Variables de Entorno

- **Cero Credenciales en Código:** Se eliminaron contraseñas en duro de correo electrónico de `server.ts`. Toda la configuración sensible reside en variables de entorno.
- **Plantilla Segura:** Consulte `.env.example` para los valores requeridos.

### Configuración de `.env`

```ini
# Supabase Database & Auth
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Notificaciones por Correo Electrónico (Nodemailer / Gmail SMTP)
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_password_de_aplicacion
MAIL_FROM=Obsidiana Joyería <tu_correo@gmail.com>

# Google Maps Platform (Opcional - Geocodificación & Coordenadas)
GOOGLE_MAPS_PLATFORM_KEY=tu_google_maps_key
```

---

## 🗄️ 4. Base de Datos y Migraciones SQL

Las migraciones de base de datos se encuentran versionadas cronológicamente en [`supabase/migrations/`](supabase/migrations/):

1. **`20261001_initial_schema.sql`**: Tablas maestras (`provincias`, `zonas`, `distritos`, `productos`, `clientes`, `pedidos`, `pedido_items`, `movimientos_stock`, `configuracion_envio`).
2. **`20261002_create_profiles.sql`**: Perfiles de usuarios del sistema y roles de administración.
3. **`20261003_catalog_47_products.sql`**: Catálogo base oficial de 47 joyas categorizadas en Plata 925/950.
4. **`20261004_indexes_and_constraints.sql`**: Índices de alto rendimiento para búsqueda rápida por SKU, filtros de catálogo, ordenamiento de tracking por fecha y claves foráneas.

### Procedimiento para Aplicar Migraciones
1. Inicie sesión en su consola de **Supabase Dashboard**.
2. Diríjase a **SQL Editor**.
3. Ejecute los archivos de migración en orden numérico.
4. Para entornos locales con Supabase CLI:
   ```bash
   npx supabase db push
   ```

### Procedimiento de Recuperación (Rollback)
Si requiere revertir cambios en un entorno de desarrollo:
- Todos los índices cuentan con `IF NOT EXISTS` y `DROP INDEX CONCURRENTLY idx_nombre`.
- Los datos se encuentran desacoplados de la lógica del cliente y cuentan con fallback offline automático en `server/mockDb.ts`.

---

## 🚀 5. Instalación y Ejecución Local

### Prerrequisitos
- Node.js versión 18+ (probado en Node.js v24 LTS)
- npm versión 9+

### Pasos de Instalación
```bash
# 1. Clonar repositorio e instalar dependencias
git clone <url-del-repo>
cd obs-store
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Comprobación estricta de tipos y linteo
npm run lint

# 4. Iniciar servidor de desarrollo (Frontend + Backend)
npm run dev

# 5. Generar build de producción
npm run build
```

---

## 🧩 6. Guía para Agregar una Nueva Funcionalidad

Para mantener el proyecto ordenado y extensible, siga este procedimiento:

1. **Definir el Dominio:** Identifique si la funcionalidad pertenece a un módulo existente (`orders`, `products`, `shipping`, `clients`) o requiere uno nuevo en `src/modules/<nuevo_dominio>/`.
2. **Crear Tipos:** Declare las interfaces en `src/types.ts` con tipos estrictos (evitar `any`).
3. **Crear el Servicio de Datos:** En `src/modules/<nuevo_dominio>/services/`, cree el servicio que encapsule las llamadas a Supabase con fallback a mock si la conexión falla.
4. **Crear Componentes:** En `src/modules/<nuevo_dominio>/components/`, divida vistas complejas en subcomponentes pequeños (KPIs, tablas, modales).
5. **Re-exportar:** Si componentes de nivel superior necesitan consumirlo, agregue re-exports en `src/components/` o `src/lib/services.ts`.
6. **Verificación Automática:** Ejecute `npm run lint` y `npm run build` antes de realizar commit.
