-- ====================================================================
-- OBSIDIANA 2026 — Catálogo Oficial 47 Productos
-- Ejecutar en Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Desactivar todos los productos existentes
UPDATE productos SET activo = false WHERE precio > -1;

-- 2. Insertar / actualizar los 47 productos con materiales y descripciones correctos
INSERT INTO productos (sku, nombre, categoria, material, precio, stock, stock_minimo, descripcion, activo) VALUES

-- ── ARETES (1–17) ────────────────────────────────────────────────────
('OBS-ARE-001', 'Conchita',          'Aretes', 'Plata 950', 59.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-002', 'Esfera',            'Aretes', 'Plata 950', 49.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-003', 'Corazón Liso',      'Aretes', 'Plata 950', 39.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-004', 'Flor Rosa',         'Aretes', 'Plata 950', 39.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-005', 'Corazón Rosa',      'Aretes', 'Plata 950', 49.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-006', 'Corazón Circón',    'Aretes', 'Plata 950', 49.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-007', 'Corazón Perla',     'Aretes', 'Plata 950', 49.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-008', 'Flor Perla',        'Aretes', 'Plata 950', 49.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-009', 'Estrella de Mar',   'Aretes', 'Plata 950', 59.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-010', 'Pastilla',          'Aretes', 'Plata 950', 49.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-011', 'Triqueta',          'Aretes', 'Plata 925', 59.00, 1, 5, 'Aretes de Plata 925', true),
('OBS-ARE-012', 'Brillantes',        'Aretes', 'Plata 925', 49.00, 1, 5, 'Aretes de Plata 925', true),
('OBS-ARE-013', 'Huella',            'Aretes', 'Plata 925', 59.00, 1, 5, 'Aretes de Plata 925', true),
('OBS-ARE-014', 'Búho',              'Aretes', 'Plata 925', 59.00, 1, 5, 'Aretes de Plata 925', true),
('OBS-ARE-015', 'Argolla Entrochada','Aretes', 'Plata 950', 69.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-016', 'Argolla Lisa',      'Aretes', 'Plata 950', 69.00, 1, 5, 'Aretes de Plata 950', true),
('OBS-ARE-017', 'Rombos',            'Aretes', 'Plata 925', 59.00, 1, 5, 'Aretes de Plata 925 — AGOTADO', true),

-- ── CONJUNTOS (18–21) ────────────────────────────────────────────────
('OBS-CON-018', 'Conjunto Aros',          'Conjuntos', 'Plata 925', 89.00, 1, 5, 'Aretes de Plata 925 - Cadena Cola de Ratón Plata 925 (45cm). Precio especial, antes S/120', true),
('OBS-CON-019', 'Conjunto Perla Circón',  'Conjuntos', 'Plata 925', 89.00, 1, 5, 'Aretes y Dije de Plata 925 - Cadena Cola de Ratón Plata 925 (45cm). Precio especial, antes S/120', true),
('OBS-CON-020', 'Conjunto Corazón Verde', 'Conjuntos', 'Plata 925', 99.00, 1, 5, 'Aretes de Plata 925 - Cadena Cola de Ratón Plata 925 (45cm). Precio especial, antes S/150', true),
('OBS-CON-021', 'Conjunto Mandala',       'Conjuntos', 'Plata 925', 89.00, 1, 5, 'Aretes de Plata 925 - Cadena Cola de Ratón Plata 925 (45cm). Precio especial, antes S/120', true),

-- ── COLLARES (22–36) ─────────────────────────────────────────────────
('OBS-COL-022', 'Nudo de Bruja',      'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 - Cadena Soga de Plata 950 (45cm)', true),
('OBS-COL-023', 'Flor de Loto',       'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-024', 'Girasol',            'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-025', 'Flor Andina',        'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-026', 'Corazón Amazonita',  'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 con Piedra Natural - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-027', 'Obsidiana',          'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 con Piedra Natural - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-028', 'Amatista',           'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 con Piedra Natural - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-029', 'Flor Cosmos',        'Collares', 'Plata 950', 89.00, 1, 5, 'Dije de Plata 950 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-030', 'Trebol',             'Collares', 'Plata 925', 89.00, 1, 5, 'Dije de Plata 925 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-031', 'Corazón Diamantado', 'Collares', 'Plata 925', 79.00, 1, 5, 'Dije de Plata 925 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-032', 'Estrella de Mar',    'Collares', 'Plata 950', 79.00, 1, 5, 'Dije de Plata 950 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-033', 'Estrella Lisa',      'Collares', 'Plata 950', 79.00, 1, 5, 'Dije Plata 950 - Cadena Cola de Ratón Plata 925 (45cm)', true),
('OBS-COL-034', 'Cruz Andina',        'Collares', 'Plata 925', 79.00, 1, 5, 'Dije de Plata 925 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-035', 'Hoja Arce',          'Collares', 'Plata 925', 79.00, 1, 5, 'Dije de Plata 925 - Cadena Pancer de Plata 950 (45cm)', true),
('OBS-COL-036', 'Collar Satelital',   'Collares', 'Plata 950', 65.00, 1, 5, 'Collar de Plata 950 (45cm)', true),

-- ── PULSERAS (37–42) ─────────────────────────────────────────────────
('OBS-PUL-037', 'Corazón Rojo',    'Pulseras', 'Plata 925', 59.00, 1, 5, 'Pulsera de Plata 925 - Regulable', true),
('OBS-PUL-038', 'Trebol Brillante','Pulseras', 'Plata 925', 59.00, 1, 5, 'Pulsera de Plata 925 - Regulable', true),
('OBS-PUL-039', 'Tres Lazos',      'Pulseras', 'Plata 925', 55.00, 1, 5, 'Pulsera de Plata 925 - Regulable', true),
('OBS-PUL-040', 'Corazones',       'Pulseras', 'Plata 925', 55.00, 1, 5, 'Pulsera doble de Plata 925 - Regulable', true),
('OBS-PUL-041', 'Eslabones Finos', 'Pulseras', 'Plata 950', 49.00, 1, 5, 'Pulseras de Plata 950 - Gucci, Entorchada, Pancer', true),
('OBS-PUL-042', 'Eclipse',         'Pulseras', 'Plata 925', 55.00, 1, 5, 'Pulsera de Plata 925', true),

-- ── ANILLOS (43–47) ──────────────────────────────────────────────────
('OBS-ANI-043', 'Margarita',      'Anillos', 'Plata 950', 49.00, 1, 5, 'Anillo de Plata 950', true),
('OBS-ANI-044', 'Eslabones',      'Anillos', 'Plata 925', 39.00, 1, 5, 'Anillo de Plata 925', true),
('OBS-ANI-045', 'Órbita',         'Anillos', 'Plata 950', 39.00, 1, 5, 'Anillo de Plata 950', true),
('OBS-ANI-046', 'Infinito',       'Anillos', 'Plata 950', 39.00, 1, 5, 'Anillo de Plata 950', true),
('OBS-ANI-047', 'Corazón Circón', 'Anillos', 'Plata 950', 39.00, 1, 5, 'Anillos de Plata 950 - Colores: Rojo, Blanco, Morado, Rosa', true)

ON CONFLICT (sku) DO UPDATE SET
  nombre      = EXCLUDED.nombre,
  categoria   = EXCLUDED.categoria,
  material    = EXCLUDED.material,
  precio      = EXCLUDED.precio,
  stock       = EXCLUDED.stock,
  descripcion = EXCLUDED.descripcion,
  activo      = EXCLUDED.activo;


-- Reiniciar movimientos de stock para empezar desde cero
DELETE FROM stock_movimientos;
