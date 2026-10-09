import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { OrdersList } from './components/OrdersList';
import { PosModule } from './components/PosModule';
import { OrderRegistrationModal } from './components/OrderRegistrationModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { InventoryModule } from './components/InventoryModule';
import { AddProductModal } from './components/AddProductModal';
import { StockMovementModal } from './components/StockMovementModal';
import { AddZoneModal } from './components/AddZoneModal';

// Lazy loaded heavy modules for bundle splitting & performance
const PublicCatalog = React.lazy(() => import('./components/PublicCatalog').then(m => ({ default: m.PublicCatalog })));
const ShippingZonesModule = React.lazy(() => import('./components/ShippingZonesModule').then(m => ({ default: m.ShippingZonesModule })));
const TrackingModule = React.lazy(() => import('./components/TrackingModule').then(m => ({ default: m.TrackingModule })));
const ReportsModule = React.lazy(() => import('./components/ReportsModule').then(m => ({ default: m.ReportsModule })));
const EmailNotificationsModule = React.lazy(() => import('./components/EmailNotificationsModule').then(m => ({ default: m.EmailNotificationsModule })));
const ClientsModule = React.lazy(() => import('./components/ClientsModule').then(m => ({ default: m.ClientsModule })));

const ModuleLoadingSpinner = () => (
  <div className="flex items-center justify-center p-16">
    <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
    <span className="ml-3 text-xs font-semibold text-zinc-600">Cargando módulo...</span>
  </div>
);
import { 
  Product, 
  Province, 
  District, 
  Zone, 
  Order, 
  StockMovement, 
  EmailLog, 
  OrderStatus 
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_PROVINCES,
  INITIAL_DISTRICTS,
  INITIAL_ZONES,
  INITIAL_ORDERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_EMAIL_LOGS,
} from './data/mockData';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { productosService, pedidosService, configService, clientesService } from './lib/services';
import { zonasService } from './lib/zonasService';

import { buildOrderEmailHtml } from './modules/notifications/templates/orderEmailHtml';
import { LoginScreen } from './modules/auth/components/LoginScreen';
import { Toast } from './components/Toast';
import { supabase } from './lib/supabase';

const SECRET_ADMIN_HASH = '#biribiribanban';
const LEGACY_ADMIN_HASH = '#rubenasmat';

const checkIsAdminHash = () => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  return hash === SECRET_ADMIN_HASH || hash === LEGACY_ADMIN_HASH;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'orders' | 'pos' | 'inventory' | 'shipping' | 'tracking' | 'reports' | 'emails' | 'clients'>('pos');

  // Backend state
  const [products, setProducts] = useState<Product[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Nuevo estado para catálogo público
  const [isAdminRoute, setIsAdminRoute] = useState(() => checkIsAdminHash() || !!localStorage.getItem('obs_admin_session'));
  const [session, setSession] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('obs_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [adjustStockProduct, setAdjustStockProduct] = useState<Product | null>(null);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [trackingCodeForSearch, setTrackingCodeForSearch] = useState('');

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Bootstrap initial data
  const loadInitialData = async () => {
    try {
      const [dbProductos, dbZonas, dbProvincias, dbPedidos] = await Promise.all([
        productosService.getAll(),
        configService.getZonas(),
        configService.getProvincias(),
        pedidosService.getAll()
      ]);

      // Try to get imageUrl from mockData by name if SKU mapping might be wrong
      const getMockImage = (nombre: string, sku: string) => {
        const mock = INITIAL_PRODUCTS.find(m => m.name.toLowerCase() === nombre.toLowerCase());
        if (mock?.imageUrl) return { imageUrl: mock.imageUrl, hoverImageUrl: mock.hoverImageUrl };
        if (sku && sku !== 'N/A') {
          const path = `/productos/${sku.toLowerCase().replace('obs-', 'prod-')}.jpeg`;
          return { imageUrl: path, hoverImageUrl: path.replace('.jpeg', '-hover.jpeg') };
        }
        return { imageUrl: undefined, hoverImageUrl: undefined };
      };

      const mappedProducts: Product[] = dbProductos.map((p: any) => {
        const imgs = getMockImage(p.nombre, p.sku || '');
        return {
          id: p.id,
          sku: p.sku || 'N/A',
          name: p.nombre,
          category: p.categoria,
          price: Number(p.precio),
          stock: p.stock,
          minStock: p.stock_minimo || 5,
          location: p.ubicacion || 'Almacén',
          updatedAt: p.updated_at,
          imageUrl: p.imagen_url || imgs.imageUrl,
          hoverImageUrl: imgs.hoverImageUrl,
        };
      });

      const mappedOrders: Order[] = dbPedidos.map((p: any) => ({
        id: p.id,
        orderNumber: p.numero_pedido || p.numero_nota,
        trackingCode: p.codigo_tracking,
        customer: {
          name: p.cliente_nombre,
          email: p.cliente_email || '',
          phone: p.cliente_telefono || '',
          address: p.cliente_direccion || '',
          province: p.cliente_provincia || '',
          district: p.cliente_distrito || '',
          zone: p.cliente_zona || '',
          notes: p.cliente_notas || '',
        },
        items: p.pedido_items ? p.pedido_items.map((i: any) => ({
          productId: i.producto_id,
          productName: i.producto_nombre,
          sku: i.sku || '',
          quantity: i.cantidad,
          unitPrice: Number(i.precio_unitario),
          total: Number(i.total),
        })) : [],
        subtotal: Number(p.subtotal),
        shippingFee: Number(p.tarifa_envio || 0),
        total: Number(p.total),
        status: p.estado as OrderStatus,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        estimatedDelivery: p.entrega_estimada || '',
        paymentMethod: p.metodo_pago,
        timeline: [],
      }));

      const [provs, zons, dists] = await Promise.all([
        zonasService.getProvincias(),
        zonasService.getZonas(),
        zonasService.getDistritos()
      ]);

      setProvinces(provs.length > 0 ? provs : INITIAL_PROVINCES);
      setZones(zons.length > 0 ? zons : INITIAL_ZONES);
      setDistricts(dists.length > 0 ? dists : INITIAL_DISTRICTS);

      // Productos cargados localmente (persistencia en localStorage o mockData)
      setProducts(mappedProducts.length > 0 ? mappedProducts : INITIAL_PRODUCTS);
      setOrders(mappedOrders);

      // Stock local y logs
      setStockMovements([]);
      setEmailLogs([]);

    } catch (err) {
      console.error('Error cargando datos locales:', err);
      // Fallback completo a mockData si ocurre un error
      setProducts(INITIAL_PRODUCTS);
      setProvinces(INITIAL_PROVINCES);
      setZones(INITIAL_ZONES);
      setDistricts(INITIAL_DISTRICTS);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Escuchar cambios en el hash de la URL
    const handleHashChange = () => {
      if (checkIsAdminHash()) { setIsAdminRoute(true); }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const cleanEmail = authEmail.trim().toLowerCase();
      const cleanPass = authPassword.trim();

      if (!cleanEmail || !cleanPass) {
        setAuthError('Por favor ingresa usuario/correo y contraseña.');
        setAuthLoading(false);
        return;
      }

      // 1. Validar contra Supabase RPC fn_login si está disponible
      try {
        const { data, error } = await supabase.rpc('fn_login', {
          p_email: cleanEmail,
          p_password: cleanPass
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const u = data[0];
          const localSession = {
            user: {
              id: u.user_id,
              email: u.email,
              user_metadata: { 
                name: u.full_name,
                role: u.role_code,
                roleName: u.role_name
              },
            },
            role: u.role_code,
            roleName: u.role_name,
            access_token: 'supabase-token-' + u.user_id,
          };
          setSession(localSession);
          localStorage.setItem('obs_admin_session', JSON.stringify(localSession));
          localStorage.setItem('obsidiana_admin_user', JSON.stringify({
            userId: u.user_id,
            email: u.email,
            fullName: u.full_name,
            roleCode: u.role_code,
            roleName: u.role_name,
            permissions: u.permissions || []
          }));
          showToast(`¡Bienvenido ${u.full_name}! Acceso como ${u.role_code}.`);
          return;
        }
      } catch (rpcErr) {
        console.warn('Supabase fn_login RPC error / fallback:', rpcErr);
      }

      // 2. Fallback local para OWNER y ADMIN
      if (cleanEmail === 'valentino@obsidiana.com' && cleanPass === '30092023') {
        const ownerSession = {
          user: {
            id: 'usr-owner-001',
            email: 'valentino@obsidiana.com',
            user_metadata: { name: 'Valentino', role: 'OWNER', roleName: 'Propietario General' },
          },
          role: 'OWNER',
          roleName: 'Propietario General',
          access_token: 'local-token-owner',
        };
        setSession(ownerSession);
        localStorage.setItem('obs_admin_session', JSON.stringify(ownerSession));
        localStorage.setItem('obsidiana_admin_user', JSON.stringify({
          userId: 'usr-owner-001',
          email: 'valentino@obsidiana.com',
          fullName: 'Valentino',
          roleCode: 'OWNER',
          roleName: 'Propietario General',
          permissions: ['*']
        }));
        showToast('¡Bienvenido Valentino! Acceso total como OWNER.');
        return;
      }

      if (cleanEmail === 'ruben@obsidiana.com' && cleanPass === '3009202620') {
        const adminSession = {
          user: {
            id: 'usr-admin-002',
            email: 'ruben@obsidiana.com',
            user_metadata: { name: 'Rubén Asmat', role: 'ADMIN', roleName: 'Administrador de Operaciones' },
          },
          role: 'ADMIN',
          roleName: 'Administrador de Operaciones',
          access_token: 'local-token-admin',
        };
        setSession(adminSession);
        localStorage.setItem('obs_admin_session', JSON.stringify(adminSession));
        localStorage.setItem('obsidiana_admin_user', JSON.stringify({
          userId: 'usr-admin-002',
          email: 'ruben@obsidiana.com',
          fullName: 'Rubén Asmat',
          roleCode: 'ADMIN',
          roleName: 'Administrador de Operaciones',
          permissions: ['pos:access', 'orders:access', 'inventory:access', 'shipping:access']
        }));
        showToast('¡Bienvenido Rubén! Acceso operativo como ADMIN.');
        return;
      }

      if (cleanEmail === 'tino' && cleanPass === '123') {
        const legacySession = {
          user: {
            id: 'admin-tino',
            email: 'tino',
            user_metadata: { name: 'Tino Admin', role: 'OWNER' },
          },
          role: 'OWNER',
          access_token: 'local-token-tino',
        };
        setSession(legacySession);
        localStorage.setItem('obs_admin_session', JSON.stringify(legacySession));
        showToast('¡Bienvenido!');
        return;
      }

      setAuthError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      setAuthError('Error procesando el inicio de sesión.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('obs_admin_session');
    localStorage.removeItem('obsidiana_admin_user');
    setSession(null);
    window.location.hash = '';
    setIsAdminRoute(false);
    showToast('Sesión cerrada correctamente.');
  };


  // --- API HANDLERS ---

  // 1. Submit Order
  const handleCreateOrder = async (orderData: any) => {
    try {
      // Buscar o crear cliente primero
      let cliente_id = undefined;
      if (orderData.customer) {
        const id = await clientesService.buscarOCrear({
          nombre: orderData.customer.name,
          email: orderData.customer.email,
          telefono: orderData.customer.phone,
          direccion: orderData.customer.address,
          provincia: orderData.customer.province,
          distrito: orderData.customer.district,
        });
        if (id) cliente_id = id;
      }

      const result = await pedidosService.crear({
        numero_nota: 'NV-' + Math.floor(Math.random() * 10000),
        cliente_id: cliente_id,
        cliente_nombre: orderData.customer.name,
        cliente_email: orderData.customer.email,
        cliente_telefono: orderData.customer.phone,
        cliente_direccion: orderData.customer.address,
        cliente_provincia: orderData.customer.province,
        cliente_distrito: orderData.customer.district,
        cliente_zona: orderData.customer.zone,
        cliente_notas: orderData.customer.notes,
        subtotal: orderData.subtotal,
        descuento: 0,
        costo_envio: orderData.shippingFee,
        total: orderData.total,
        adelanto: 0,
        saldo: orderData.total,
        tipo_entrega: orderData.shippingFee > 15 ? 'provincia' : 'express',
        metodo_pago: 'Efectivo',
        estado: 'pendiente',
        items: orderData.items.map((i: any) => ({
          producto_id: i.productId,
          producto_nombre: i.productName,
          cantidad: i.quantity,
          precio_unitario: i.unitPrice,
          total: i.total
        }))
      });

      showToast(`¡Pedido creado exitosamente!`);
      loadInitialData(); // Recargar datos locales con el nuevo pedido y stock actualizado
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Error al crear pedido');
    }
  };

  // 2. Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    try {
      // 1. Update in local orders service
      await pedidosService.updateEstado(orderId, status);

      // 2. Prepare mock order data for Express server to send the email
      const targetOrder = orders.find((o) => o.id === orderId);
      const mappedOrder = targetOrder ? {
        id: targetOrder.id,
        orderNumber: targetOrder.orderNumber || targetOrder.numero_pedido || '',
        trackingCode: targetOrder.trackingCode || targetOrder.codigo_tracking || '',
        timeline: [], // Express tries to update timeline
        customer: {
          name: targetOrder.customer?.name || targetOrder.cliente_nombre || '',
          email: targetOrder.customer?.email || targetOrder.cliente_email || '',
        }
      } : null;

      // 3. Trigger Express to send email
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, note, orderData: mappedOrder }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            setEmailLogs((prev) => [data.email, ...prev]);
          }
        }
      } catch (e) {
        console.warn('Backend express no disponible para enviar correos');
      }

      // 4. Update UI State
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, estado: status } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status, estado: status });
      }

      showToast(`Estado de pedido actualizado a "${status.toUpperCase()}". Correo enviado al cliente.`);
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  // 2.1 Delete Order (con devolución automática de stock si no estaba anulado)
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      const shouldRestore = targetOrder ? targetOrder.status !== 'cancelado' : true;
      const itemsToRestore = targetOrder ? targetOrder.items.map(i => ({
        producto_id: i.productId,
        producto_nombre: i.productName,
        sku: i.sku,
        cantidad: i.quantity
      })) : undefined;

      await pedidosService.delete(orderId, shouldRestore, itemsToRestore);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
      
      // Recargar catálogo y stock actualizado
      await loadInitialData();
      showToast('Pedido eliminado y stock devuelto exitosamente al inventario.');
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar pedido', 'error');
    }
  };

  // 2.2 Edit Order (con ajuste de stock si cambia estado a/de cancelado)
  const handleEditOrder = async (orderId: string, updatedData: Partial<Order>) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      
      // Si el estado cambia de activo a cancelado -> Devolver stock
      if (targetOrder && targetOrder.status !== 'cancelado' && updatedData.status === 'cancelado') {
        const items = targetOrder.items.map(i => ({
          producto_id: i.productId,
          producto_nombre: i.productName,
          sku: i.sku,
          cantidad: i.quantity
        }));
        await pedidosService.restaurarStockItems(items, `Devolución por cambio de estado a Cancelado (Pedido ${targetOrder.orderNumber})`);
      }
      // Si el estado cambia de cancelado a activo -> Descontar stock
      else if (targetOrder && targetOrder.status === 'cancelado' && updatedData.status && updatedData.status !== 'cancelado') {
        const items = targetOrder.items.map(i => ({
          producto_id: i.productId,
          producto_nombre: i.productName,
          sku: i.sku,
          cantidad: i.quantity
        }));
        await pedidosService.descontarStockItems(items, `Deducción por reactivación de pedido ${targetOrder.orderNumber}`);
      }

      const updates: Record<string, any> = {};
      if (updatedData.customer) {
        updates.cliente_nombre = updatedData.customer.name;
        updates.cliente_telefono = updatedData.customer.phone;
        updates.cliente_email = updatedData.customer.email;
        updates.cliente_direccion = updatedData.customer.address;
        updates.cliente_distrito = updatedData.customer.district;
        updates.cliente_provincia = updatedData.customer.province;
        updates.cliente_zona = updatedData.customer.zone;
        updates.cliente_notas = updatedData.customer.notes;
      }
      if (updatedData.shippingFee !== undefined) updates.tarifa_envio = updatedData.shippingFee;
      if (updatedData.adelanto !== undefined) updates.adelanto = updatedData.adelanto;
      if (updatedData.total !== undefined) updates.total = updatedData.total;
      if (updatedData.paymentMethod !== undefined) updates.metodo_pago = updatedData.paymentMethod;
      if (updatedData.status !== undefined) updates.estado = updatedData.status;

      await pedidosService.update(orderId, updates);

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              ...updatedData,
              customer: updatedData.customer ? { ...o.customer, ...updatedData.customer } : o.customer,
            };
          }
          return o;
        })
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                ...updatedData,
                customer: updatedData.customer ? { ...prev.customer, ...updatedData.customer } : prev.customer,
              }
            : null
        );
      }

      await loadInitialData();
      showToast('Pedido actualizado correctamente.');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar pedido', 'error');
      throw err;
    }
  };

  // 2.3 Anular Order (con devolución automática de stock)
  const handleAnularOrder = async (orderId: string, reason?: string) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      const itemsToRestore = targetOrder ? targetOrder.items.map(i => ({
        producto_id: i.productId,
        producto_nombre: i.productName,
        sku: i.sku,
        cantidad: i.quantity
      })) : undefined;

      await pedidosService.anular(orderId, reason, itemsToRestore);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'cancelado' as OrderStatus,
                customer: {
                  ...o.customer,
                  notes: reason ? `ANULADO: ${reason}` : o.customer.notes,
                },
              }
            : o
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'cancelado' as OrderStatus,
                customer: {
                  ...prev.customer,
                  notes: reason ? `ANULADO: ${reason}` : prev.customer.notes,
                },
              }
            : null
        );
      }

      // Recargar catálogo y stock en vivo
      await loadInitialData();
      showToast('Pedido anulado y stock devuelto exitosamente al inventario.');
    } catch (err: any) {
      showToast(err.message || 'Error al anular pedido', 'error');
    }
  };

  // 3. Add Product
  const handleAddProduct = async (productData: any) => {
    try {
      await productosService.create({
        nombre:       productData.name,
        categoria:    productData.category,
        material:     productData.material || 'Plata 950',
        precio:       productData.price,
        stock:        productData.stock,
        stock_minimo: productData.minStock,
        sku:          productData.sku,
        ubicacion:    productData.location || 'Vitrina Principal',
        descripcion:  productData.description || '',
        imagen_url:   productData.imageUrl || null,
        activo:       true
      });
      showToast(`¡Joya "${productData.name}" agregada al catálogo!`);
      loadInitialData();
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Error al agregar producto');
    }
  };


  // 4. Adjust Stock
  const handleAdjustStock = async (
    productId: string,
    quantity: number,
    type: 'in' | 'out' | 'adjustment',
    reason: string,
    performedBy: string
  ) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Producto no encontrado');
      
      let newStock = product.stock;
      if (type === 'in') newStock += quantity;
      if (type === 'out') newStock -= quantity;
      if (type === 'adjustment') newStock = quantity;

      await productosService.updateStock(productId, newStock);
      showToast(`¡Stock actualizado para "${product.name}"!`);
      loadInitialData(); // reload from local data
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Error al ajustar stock');
    }
  };

  // 5. Add Zone
  const handleAddZone = async (zoneData: any) => {
    try {
      const newZone = await zonasService.crearZona(zoneData);
      setZones((prev) => [newZone, ...prev]);
      showToast(`Nueva zona de envío "${newZone.name}" creada.`);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Error al agregar zona');
    }
  };

  const handleUpdateZone = async (zoneId: string, updates: any) => {
    try {
      await zonasService.actualizarZona(zoneId, updates);
      setZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...updates } : z));
      showToast(`Zona actualizada exitosamente.`);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Error al actualizar zona');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await zonasService.eliminarZona(zoneId);
      setZones(prev => prev.filter(z => z.id !== zoneId));
      // Also delete local districts attached to it
      setDistricts(prev => prev.filter(d => d.zoneId !== zoneId));
      showToast(`Zona eliminada exitosamente.`);
    } catch (err: any) {
      console.error(err);
      showToast(`Error al eliminar zona: ${err.message}`, 'error');
    }
  };

  // 6. Add District
  const handleAddDistrict = async (districtData: any) => {
    try {
      const newDist = await zonasService.crearDistrito(districtData);
      setDistricts((prev) => [...prev, newDist]);
      showToast(`Distrito "${newDist.name}" mapeado exitosamente.`);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Error al agregar distrito');
    }
  };

  const handleDeleteDistrict = async (districtId: string) => {
    try {
      await zonasService.eliminarDistrito(districtId);
      setDistricts(prev => prev.filter(d => d.id !== districtId));
      showToast(`Distrito eliminado exitosamente.`);
    } catch (err: any) {
      console.error(err);
      showToast(`Error al eliminar distrito: ${err.message}`, 'error');
    }
  };

  // 7. Test Email Send
  const handleSendTestEmail = async (
    recipientEmail: string,
    recipientName: string,
    subject: string,
    bodyHtml: string
  ) => {
    const res = await fetch('/api/emails/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail, recipientName, subject, bodyHtml }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al enviar correo');
    }

    const data = await res.json();
    setEmailLogs((prev) => [data.email, ...prev]);
    showToast(`Correo de prueba enviado a ${recipientEmail}`);
  };

  // 8. Reset Data
  const handleResetData = async () => {
    if (!window.confirm('¿Deseas restablecer los datos de la aplicación a su estado inicial de demostración?')) {
      return;
    }

    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        await loadInitialData();
        showToast('Datos del sistema restablecidos.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 9. Auto-process orders statuses (automated logistics flow)
  const handleAutoProcessOrders = async () => {
    const res = await fetch('/api/orders/auto-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(`Error en procesamiento automático: ${err.error || 'Intente nuevamente'}`, 'error');
      return;
    }

    const data = await res.json();
    setOrders(data.orders || []);
    setEmailLogs((prev) => [...(data.emailLogs || []), ...prev]);
    showToast(data.message || 'Procesamiento automático completado.');
  };

  // Jump to tracking tab with code
  const handleTrackCodeRedirect = (trackingCode: string) => {
    setTrackingCodeForSearch(trackingCode);
    setActiveTab('tracking');
  };

  // Badges
  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente' || o.status === 'en_preparacion').length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // Si es la vista pública, renderizar SOLAMENTE el catálogo virtual
  if (!isAdminRoute) {
    return (
      <React.Suspense fallback={<ModuleLoadingSpinner />}>
        <PublicCatalog products={products} />
      </React.Suspense>
    );
  }

  if (!session) {
    return (
      <LoginScreen
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        authLoading={authLoading}
        onLogin={handleLogin}
        onGoToPublic={() => { window.location.hash = ''; window.location.reload(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/90 text-stone-900 flex flex-col md:flex-row font-sans selection:bg-stone-900 selection:text-amber-300">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockCount}
        onLogout={handleLogout}
      />

      {/* Main Content Area (Beside Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-stone-200/80 px-6 py-3.5 hidden md:flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">OBSIDIANA ADMIN</span>
            <span className="text-stone-300">/</span>
            <span className="text-xs font-black text-stone-900 tracking-wide uppercase">
              {activeTab === 'pos' && 'Punto de Venta / POS'}
              {activeTab === 'orders' && 'Gestión de Pedidos'}
              {activeTab === 'inventory' && 'Inventario de Joyas'}
              {activeTab === 'shipping' && 'Zonas & Tarifas de Envío'}
              {activeTab === 'tracking' && 'Rastreo en Vivo'}
              {activeTab === 'reports' && 'Reportes & Finanzas'}
              {activeTab === 'emails' && 'Notificaciones & WhatsApp'}
              {activeTab === 'clients' && 'Directorio de Clientes'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistema Operativo Local</span>
            </div>
            <div className="text-right text-[11px] text-stone-500">
              <span className="font-semibold text-stone-700">tino (Admin)</span>
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <React.Suspense fallback={<ModuleLoadingSpinner />}>
            {activeTab === 'pos' && (
              <PosModule
                products={products}
                provinces={provinces}
                districts={districts}
                zones={zones}
                onSubmitOrder={handleCreateOrder}
                onSendTestEmail={handleSendTestEmail}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersList
                orders={orders}
                onSelectOrder={(ord) => setSelectedOrder(ord)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onTrackOrder={handleTrackCodeRedirect}
                onOpenNewOrder={() => setIsNewOrderOpen(true)}
                onAutoProcess={handleAutoProcessOrders}
                onDeleteOrder={handleDeleteOrder}
                onEditOrder={handleEditOrder}
                onAnularOrder={handleAnularOrder}
                provinces={provinces}
                zones={zones}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryModule
                products={products}
                stockMovements={stockMovements}
                onOpenAddProduct={() => setIsAddProductOpen(true)}
                onOpenAdjustStock={(p) => setAdjustStockProduct(p)}
              />
            )}

            {activeTab === 'shipping' && (
              <ShippingZonesModule
                provinces={provinces}
                districts={districts}
                zones={zones}
                onOpenAddZone={() => setIsAddZoneOpen(true)}
                onAddDistrict={handleAddDistrict}
                onDeleteZone={handleDeleteZone}
                onUpdateZone={handleUpdateZone}
                onDeleteDistrict={handleDeleteDistrict}
              />
            )}

            {activeTab === 'tracking' && (
              <TrackingModule
                orders={orders}
                initialSearchCode={trackingCodeForSearch}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsModule
                orders={orders}
                products={products}
              />
            )}

            {activeTab === 'emails' && (
              <EmailNotificationsModule
                emailLogs={emailLogs}
                onSendTestEmail={handleSendTestEmail}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsModule orders={orders} />
            )}
          </React.Suspense>
        </main>

        {/* Footer */}
        <footer className="border-t border-stone-200/80 bg-white py-4 px-6 text-center text-xs text-stone-500">
          <p>Obsidiana Joyería Perú © 2026 — Plata Fina 925/950 • Taller & Showroom</p>
        </footer>
      </div>

      {/* Global Modals */}
      <OrderRegistrationModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        products={products}
        provinces={provinces}
        districts={districts}
        zones={zones}
        onSubmitOrder={handleCreateOrder}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        onSendTestEmail={handleSendTestEmail}
        onDeleteOrder={handleDeleteOrder}
        onEditOrder={handleEditOrder}
        onAnularOrder={handleAnularOrder}
        provinces={provinces}
        zones={zones}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddProduct}
      />

      <StockMovementModal
        isOpen={!!adjustStockProduct}
        product={adjustStockProduct}
        onClose={() => setAdjustStockProduct(null)}
        onAdjustStock={handleAdjustStock}
      />

      <AddZoneModal
        isOpen={isAddZoneOpen}
        onClose={() => setIsAddZoneOpen(false)}
        provinces={provinces}
        onAddZone={handleAddZone}
      />

    </div>
  );
}
