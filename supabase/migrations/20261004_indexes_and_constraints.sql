-- ====================================================================
-- MIGRATION: 20261004_indexes_and_constraints.sql
-- Optimización de Rendimiento e Índices para Consultas Frecuentes
-- Obsidiana Joyería (obs-store)
-- ====================================================================

-- 1. ÍNDICES PARA BÚSQUEDA Y FILTRADO DE PRODUCTOS
-- Justificación: Las vistas POS e Inventario filtran habitualmente por categoría,
-- estado activo, y buscan por SKU en el lector de códigos de barras.
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos (sku);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos (stock) WHERE activo = true;

-- 2. ÍNDICES PARA GESTIÓN DE PEDIDOS Y LOGÍSTICA
-- Justificación: El dashboard de pedidos ordena por fecha descendente,
-- filtra por estado ('pendiente', 'en_ruta', 'entregado') y busca por cliente.
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at_desc ON pedidos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON pedidos (numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo_tracking ON pedidos (codigo_tracking);

-- 3. ÍNDICES PARA INTEGRIDAD Y JOINS EN DETALLES DE PEDIDO
-- Justificación: Previene scans completos en la relación 1:N entre pedidos e ítems.
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto_id ON pedido_items (producto_id);

-- 4. ÍNDICES PARA KARDEX Y MOVIMIENTOS DE STOCK
-- Justificación: La pestaña de auditoría de inventario consulta por producto ordenado por fecha.
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto_id ON movimientos_stock (producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_fecha_desc ON movimientos_stock (created_at DESC);

-- 5. ÍNDICES PARA CLIENTES Y GEOLOCALIZACIÓN
-- Justificación: Autocompletado de clientes en POS por documento, teléfono o email.
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes (numero_documento);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes (telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes (email);

-- 6. ÍNDICES PARA PROVINCIAS Y DISTRITOS
CREATE INDEX IF NOT EXISTS idx_distritos_provincia_id ON distritos (provincia_id);
CREATE INDEX IF NOT EXISTS idx_distritos_zona_id ON distritos (zona_id);
