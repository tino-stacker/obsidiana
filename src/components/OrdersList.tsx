import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PackageCheck, 
  MapPin, 
  ExternalLink, 
  Printer, 
  Tag, 
  Zap, 
  Edit2, 
  Trash2, 
  Ban, 
  AlertTriangle, 
  X, 
  MessageCircle,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Send,
  Calendar
} from 'lucide-react';
import { Order, OrderStatus, Province, Zone } from '../types';
import { PackageShippingLabelModal } from './PackageShippingLabelModal';
import { EditOrderModal } from './EditOrderModal';

interface OrdersListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onTrackOrder: (trackingCode: string) => void;
  onOpenNewOrder: () => void;
  onAutoProcess?: () => void;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onEditOrder?: (orderId: string, updatedData: Partial<Order>) => Promise<void>;
  onAnularOrder?: (orderId: string, reason?: string) => Promise<void>;
  provinces?: Province[];
  zones?: Zone[];
}

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  onSelectOrder,
  onUpdateOrderStatus,
  onTrackOrder,
  onOpenNewOrder,
  onAutoProcess,
  onDeleteOrder,
  onEditOrder,
  onAnularOrder,
  provinces = [],
  zones = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<Order | null>(null);

  // Action Modals State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToAnular, setOrderToAnular] = useState<Order | null>(null);
  const [anularReason, setAnularReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelado' ? sum + o.total : sum), 0);
    const pendingCount = orders.filter((o) => o.status === 'pendiente' || o.status === 'en_preparacion').length;
    const inTransitCount = orders.filter((o) => o.status === 'en_ruta').length;
    const completedCount = orders.filter((o) => o.status === 'entregado').length;
    const averageTicket = orders.length > 0 ? totalRevenue / (orders.filter((o) => o.status !== 'cancelado').length || 1) : 0;

    return { totalRevenue, pendingCount, inTransitCount, completedCount, averageTicket };
  }, [orders]);

  // Status counts for pipeline tabs
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pendiente: orders.filter((o) => o.status === 'pendiente').length,
      en_preparacion: orders.filter((o) => o.status === 'en_preparacion').length,
      en_ruta: orders.filter((o) => o.status === 'en_ruta').length,
      entregado: orders.filter((o) => o.status === 'entregado').length,
      cancelado: orders.filter((o) => o.status === 'cancelado').length,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customer.phone && o.customer.phone.includes(searchQuery)) ||
        (o.customer.email && o.customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.customer.province && o.customer.province.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchProvince = provinceFilter === 'all' || (o.customer.province && o.customer.province.toLowerCase().includes(provinceFilter.toLowerCase()));

      return matchSearch && matchStatus && matchProvince;
    });
  }, [orders, searchQuery, statusFilter, provinceFilter]);

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-800 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pendiente</span>
          </span>
        );
      case 'en_preparacion':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-800 border border-indigo-500/30">
            <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>En Preparación</span>
          </span>
        );
      case 'en_ruta':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-800 border border-sky-500/30">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            <span>En Ruta</span>
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Entregado</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-800 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelado</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Next status transition
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'pendiente': return 'en_preparacion';
      case 'en_preparacion': return 'en_ruta';
      case 'en_ruta': return 'entregado';
      default: return null;
    }
  };

  const getNextStatusLabel = (next: OrderStatus | null): string => {
    switch (next) {
      case 'en_preparacion': return 'A Empaque';
      case 'en_ruta': return 'Despachar';
      case 'entregado': return 'Marcar Entregado';
      default: return '';
    }
  };

  const handleOpenWhatsApp = (order: Order) => {
    const phone = (order.customer.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('51') ? phone : `51${phone}`;
    const text = encodeURIComponent(
      `¡Hola ${order.customer.name}! ✨ Te saludamos de Obsidiana Joyería. Respecto a tu pedido *${order.orderNumber}* (Código de rastreo: *${order.trackingCode}*), te informamos que su estado actual es: *${order.status.toUpperCase()}*. Quedamos a tu entera disposición.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete || !onDeleteOrder) return;
    setIsProcessingAction(true);
    try {
      await onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmAnular = async () => {
    if (!orderToAnular || !onAnularOrder) return;
    setIsProcessingAction(true);
    try {
      await onAnularOrder(orderToAnular.id, anularReason);
      setOrderToAnular(null);
      setAnularReason('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">OPERACIONES & DESPACHOS</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">Gestión Central de Pedidos</h1>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Control de pedidos desde su registro en web o mostrador hasta la entrega con Shalom o motorizado express.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {onAutoProcess && (
            <button
              onClick={onAutoProcess}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Auto Procesar</span>
            </button>
          )}

          <button
            onClick={onOpenNewOrder}
            className="flex items-center space-x-2 px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold shadow-md shadow-stone-950/10 transition-all cursor-pointer active:scale-95"
          >
            <span>+ Nueva Venta / Pedido</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Facturación Activa</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-stone-900">S/ {kpis.totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Excluye anulados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Por Despachar</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-600">{kpis.pendingCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Pendientes & en empaque</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">En Tránsito</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-black text-sky-600">{kpis.inTransitCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Con guía Shalom o motorizado</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Entregados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">{kpis.completedCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Ticket promedio: S/ {kpis.averageTicket.toFixed(0)}</p>
        </div>
      </div>

      {/* Status Pipeline Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200/80 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'all', label: 'Todos', count: statusCounts.all, color: 'text-stone-700' },
            { id: 'pendiente', label: '1. Pendientes', count: statusCounts.pendiente, color: 'text-amber-600' },
            { id: 'en_preparacion', label: '2. En Preparación', count: statusCounts.en_preparacion, color: 'text-indigo-600' },
            { id: 'en_ruta', label: '3. En Ruta / Agencia', count: statusCounts.en_ruta, color: 'text-sky-600' },
            { id: 'entregado', label: '4. Entregados', count: statusCounts.entregado, color: 'text-emerald-600' },
            { id: 'cancelado', label: 'Anulados', count: statusCounts.cancelado, color: 'text-rose-600' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`
                  flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                  ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }
                `}
              >
                <span>{tab.label}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-[10px] font-black
                    ${isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-600'}
                  `}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° Pedido (NV-...), Cliente, Teléfono, Ciudad o Tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 text-stone-900 placeholder-stone-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="text-xs border border-stone-200 rounded-xl px-3.5 py-2.5 bg-stone-50 text-stone-700 focus:outline-none focus:border-stone-900 cursor-pointer font-medium"
          >
            <option value="all">Todas las Regiones</option>
            <option value="lima">Lima & Callao (Express)</option>
            <option value="arequipa">Arequipa</option>
            <option value="cusco">Cusco</option>
            <option value="trujillo">Trujillo</option>
            <option value="chiclayo">Chiclayo</option>
            <option value="piura">Piura</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-950 text-stone-200 text-[10px] uppercase tracking-wider font-black border-b border-stone-800">
                <th className="py-3.5 px-4">Pedido / Tracking</th>
                <th className="py-3.5 px-4">Cliente & Contacto</th>
                <th className="py-3.5 px-4">Destino & Logística</th>
                <th className="py-3.5 px-4">Monto Total</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-center">Gestión Rápida</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-xs text-stone-900">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-700">No se encontraron pedidos con estos criterios</p>
                    <p className="text-xs text-stone-400 mt-0.5">Intenta cambiar el estado seleccionado o el término de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCancelado = order.status === 'cancelado';
                  const nextStatus = getNextStatus(order.status);
                  const nextLabel = getNextStatusLabel(nextStatus);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      {/* Order & Tracking */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900">{order.orderNumber}</div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="font-mono text-[10px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 font-bold">
                            {order.trackingCode}
                          </span>
                          <button
                            onClick={() => onTrackOrder(order.trackingCode)}
                            title="Ver en Portal de Rastreo"
                            className="text-stone-400 hover:text-amber-600 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{order.customer.name}</div>
                        <div className="text-stone-500 text-[11px] flex items-center space-x-1 mt-0.5">
                          <span>{order.customer.phone || 'Sin tel.'}</span>
                          {order.customer.phone && (
                            <button
                              onClick={() => handleOpenWhatsApp(order)}
                              title="Abrir chat de WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 ml-1 p-0.5 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1 text-stone-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {order.customer.district || 'Lima'}, {order.customer.province || 'Lima'}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                          {order.customer.zone || 'Express'}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900">S/ {order.total.toFixed(2)}</div>
                        <div className="text-[10px] text-stone-500">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)} joyas
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center flex-wrap gap-1.5">
                          
                          {/* Next Status Quick Button */}
                          {nextStatus && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
                              title={`Avanzar estado a: ${nextStatus}`}
                              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-black transition-all flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>{nextLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {/* Rotulado */}
                          <button
                            onClick={() => setSelectedLabelOrder(order)}
                            title="Imprimir Rótulo de Envío (Shalom / Olva / Courier)"
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-all border border-stone-200 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>

                          {/* Ver Detalle */}
                          <button
                            onClick={() => onSelectOrder(order)}
                            title="Ver Detalle Completo"
                            className="p-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Direct */}
                          <button
                            onClick={() => handleOpenWhatsApp(order)}
                            title="Contactar por WhatsApp"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar Pedido */}
                          {onEditOrder && (
                            <button
                              onClick={() => setEditingOrder(order)}
                              title="Editar datos del pedido"
                              className="p-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Anular Pedido */}
                          {onAnularOrder && !isCancelado && (
                            <button
                              onClick={() => setOrderToAnular(order)}
                              title="Anular Pedido"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Eliminar Pedido */}
                          {onDeleteOrder && (
                            <button
                              onClick={() => setOrderToDelete(order)}
                              title="Eliminar permanentemente"
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Shipping Label Modal */}
      {selectedLabelOrder && (
        <PackageShippingLabelModal
          isOpen={Boolean(selectedLabelOrder)}
          onClose={() => setSelectedLabelOrder(null)}
          order={{
            id: selectedLabelOrder.id,
            orderNumber: selectedLabelOrder.orderNumber,
            trackingCode: selectedLabelOrder.trackingCode,
            customer: {
              name: selectedLabelOrder.customer.name,
              phone: selectedLabelOrder.customer.phone,
              email: selectedLabelOrder.customer.email,
              document: selectedLabelOrder.customer.document,
              docNumber: selectedLabelOrder.customer.documentNumber,
              address: selectedLabelOrder.customer.address,
              reference: selectedLabelOrder.customer.notes,
              province: selectedLabelOrder.customer.province,
              district: selectedLabelOrder.customer.district,
              zone: selectedLabelOrder.customer.zone,
              coords: selectedLabelOrder.customer.coords,
            },
            shippingAgency: selectedLabelOrder.customer.zone === 'Provincia (Agencia)' ? 'SHALOM EXPRESS' : 'MOTORIZADO EXPRESS LIMA',
            deliveryType: selectedLabelOrder.customer.zone === 'Provincia (Agencia)' ? 'provincia' : 'express',
            total: selectedLabelOrder.total,
            adelanto: selectedLabelOrder.adelanto,
            saldo: selectedLabelOrder.total - (selectedLabelOrder.adelanto || 0),
            items: selectedLabelOrder.items,
          }}
        />
      )}

      {/* Edit Order Modal */}
      {editingOrder && onEditOrder && (
        <EditOrderModal
          isOpen={Boolean(editingOrder)}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
          provinces={provinces}
          zones={zones}
          onSave={onEditOrder}
        />
      )}

      {/* Modal Confirmación Anular */}
      {orderToAnular && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">¿Anular Pedido {orderToAnular.orderNumber}?</h3>
                <p className="text-xs text-stone-500">El estado del pedido cambiará a "Cancelado" y se restablecerá el stock.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Motivo de Anulación (opcional)</label>
              <textarea
                rows={2}
                value={anularReason}
                onChange={(e) => setAnularReason(e.target.value)}
                placeholder="Ej. Cliente desistió de la compra / Error en producto..."
                className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 bg-stone-50"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToAnular(null)}
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmAnular}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black transition-colors"
              >
                {isProcessingAction ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">¿Eliminar Definitivamente?</h3>
                <p className="text-xs text-rose-600">Pedido: {orderToDelete.orderNumber}. Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {isProcessingAction ? 'Eliminando...' : 'Eliminar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
