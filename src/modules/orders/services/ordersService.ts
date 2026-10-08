import { INITIAL_ORDERS } from '../../../data/mockData';
import { productosService } from '../../products/services/productsService';

export interface PedidoInput {
  numero_nota: string;
  cliente_id?: string;
  cliente_nombre: string;
  cliente_doc?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  cliente_direccion?: string;
  cliente_referencia?: string;
  cliente_provincia?: string;
  cliente_distrito?: string;
  cliente_zona?: string;
  cliente_notas?: string;
  cliente_coords_lat?: number | null;
  cliente_coords_lng?: number | null;
  subtotal: number;
  descuento: number;
  costo_envio: number;
  total: number;
  adelanto: number;
  saldo: number;
  tipo_entrega: string;
  agencia_envio?: string;
  sede_shalom?: string;
  metodo_pago: string;
  notas?: string;
  estado?: string;
  items: {
    producto_id?: string;
    producto_nombre: string;
    material?: string;
    sku?: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
  }[];
}

const STORAGE_KEY = 'obs_orders';

const getInitialOrdersDB = (): any[] => {
  return INITIAL_ORDERS.map((o) => ({
    id: o.id,
    numero_pedido: o.orderNumber,
    numero_nota: o.orderNumber,
    codigo_tracking: o.trackingCode,
    cliente_nombre: o.customer.name,
    cliente_email: o.customer.email,
    cliente_telefono: o.customer.phone,
    cliente_direccion: o.customer.address,
    cliente_provincia: o.customer.province,
    cliente_distrito: o.customer.district,
    cliente_zona: o.customer.zone,
    cliente_notas: o.customer.notes,
    subtotal: o.subtotal,
    tarifa_envio: o.shippingFee,
    total: o.total,
    estado: o.status,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    entrega_estimada: o.estimatedDelivery,
    metodo_pago: o.paymentMethod,
    pedido_items: o.items.map((i) => ({
      producto_id: i.productId,
      producto_nombre: i.productName,
      sku: i.sku,
      cantidad: i.quantity,
      precio_unitario: i.unitPrice,
      total: i.total,
    })),
  }));
};

const getStoredOrders = (): any[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialOrdersDB();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialOrdersDB();
  }
};

const saveStoredOrders = (orders: any[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
};

export const pedidosService = {
  async crear(input: PedidoInput): Promise<{ id: string; numero_pedido: string; codigo_tracking: string }> {
    const orders = getStoredOrders();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newId = `ped-${Date.now()}`;
    const numeroPedido = `PED-2026-${randomSuffix}`;
    const codigoTracking = `TRK-${randomSuffix}`;
    const now = new Date().toISOString();

    const newOrder = {
      id: newId,
      numero_pedido: numeroPedido,
      numero_nota: input.numero_nota,
      codigo_tracking: codigoTracking,
      cliente_id: input.cliente_id,
      cliente_nombre: input.cliente_nombre,
      cliente_doc: input.cliente_doc,
      cliente_telefono: input.cliente_telefono,
      cliente_email: input.cliente_email,
      cliente_direccion: input.cliente_direccion,
      cliente_referencia: input.cliente_referencia,
      cliente_provincia: input.cliente_provincia,
      cliente_distrito: input.cliente_distrito,
      cliente_zona: input.cliente_zona,
      cliente_notas: input.cliente_notas,
      subtotal: input.subtotal,
      descuento: input.descuento,
      tarifa_envio: input.costo_envio,
      total: input.total,
      adelanto: input.adelanto,
      saldo: input.saldo,
      tipo_entrega: input.tipo_entrega,
      agencia_envio: input.agencia_envio,
      sede_shalom: input.sede_shalom,
      metodo_pago: input.metodo_pago,
      notas: input.notas,
      estado: input.estado ?? 'pendiente',
      created_at: now,
      updated_at: now,
      pedido_items: input.items.map((item) => ({
        id: `item-${Date.now()}-${Math.random()}`,
        producto_id: item.producto_id,
        producto_nombre: item.producto_nombre,
        sku: item.sku,
        material: item.material,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        total: item.total,
      })),
    };

    orders.unshift(newOrder);
    saveStoredOrders(orders);

    // Descontar stock de productos localmente
    for (const item of input.items) {
      if (item.producto_id) {
        try {
          const allProds = await productosService.getAll();
          const target = allProds.find((p) => p.id === item.producto_id);
          if (target) {
            await productosService.updateStock(
              item.producto_id,
              Math.max(0, target.stock - item.cantidad)
            );
          }
        } catch {
          // no-op
        }
      }
    }

    return {
      id: newId,
      numero_pedido: numeroPedido,
      codigo_tracking: codigoTracking,
    };
  },

  async getAll(limit = 100): Promise<any[]> {
    const orders = getStoredOrders();
    return orders.slice(0, limit);
  },

  async updateEstado(id: string, estado: string): Promise<void> {
    const orders = getStoredOrders();
    const updated = orders.map((o) =>
      o.id === id ? { ...o, estado, updated_at: new Date().toISOString() } : o
    );
    saveStoredOrders(updated);
  },

  async update(id: string, updates: Record<string, any>): Promise<void> {
    const orders = getStoredOrders();
    const updated = orders.map((o) =>
      o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    );
    saveStoredOrders(updated);
  },

  async restaurarStockItems(
    items: { producto_id?: string; producto_nombre?: string; sku?: string; cantidad: number }[],
    _motivo?: string
  ): Promise<void> {
    if (!items || items.length === 0) return;
    const allProds = await productosService.getAll();

    for (const item of items) {
      const cantidad = Number(item.cantidad) || 0;
      if (cantidad <= 0) continue;

      const target = allProds.find(
        (p) =>
          (item.producto_id && p.id === item.producto_id) ||
          (item.sku && p.sku === item.sku) ||
          (item.producto_nombre && p.nombre.toLowerCase() === item.producto_nombre.toLowerCase())
      );

      if (target) {
        await productosService.updateStock(target.id, target.stock + cantidad);
      }
    }
  },

  async descontarStockItems(
    items: { producto_id?: string; producto_nombre?: string; sku?: string; cantidad: number }[],
    _motivo?: string
  ): Promise<void> {
    if (!items || items.length === 0) return;
    const allProds = await productosService.getAll();

    for (const item of items) {
      const cantidad = Number(item.cantidad) || 0;
      if (cantidad <= 0) continue;

      const target = allProds.find(
        (p) =>
          (item.producto_id && p.id === item.producto_id) ||
          (item.sku && p.sku === item.sku) ||
          (item.producto_nombre && p.nombre.toLowerCase() === item.producto_nombre.toLowerCase())
      );

      if (target) {
        await productosService.updateStock(target.id, Math.max(0, target.stock - cantidad));
      }
    }
  },

  async anular(id: string, reason?: string, items?: any[]): Promise<void> {
    const orders = getStoredOrders();
    const target = orders.find((o) => o.id === id);
    if (!target) return;

    target.estado = 'cancelado';
    if (reason) target.cliente_notas = `ANULADO: ${reason}`;
    target.updated_at = new Date().toISOString();
    saveStoredOrders(orders);

    const itemsToRestore = items || target.pedido_items || [];
    await this.restaurarStockItems(itemsToRestore);
  },

  async delete(id: string, shouldRestoreStock = true, items?: any[]): Promise<void> {
    const orders = getStoredOrders();
    const targetIndex = orders.findIndex((o) => o.id === id);
    if (targetIndex === -1) return;

    const target = orders[targetIndex];
    if (shouldRestoreStock) {
      const itemsToRestore = items || target.pedido_items || [];
      await this.restaurarStockItems(itemsToRestore);
    }

    orders.splice(targetIndex, 1);
    saveStoredOrders(orders);
  },

  async getByNumero(numero: string): Promise<any> {
    const orders = getStoredOrders();
    return orders.find((o) => o.numero_nota === numero || o.numero_pedido === numero);
  },
};
