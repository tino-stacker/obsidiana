import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  ShoppingBag, 
  DollarSign, 
  MessageCircle, 
  Crown, 
  Star, 
  Mail, 
  Phone, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { ClientDetailModal } from './ClientDetailModal';
import { Order, Customer } from '../types';

interface ClientsModuleProps {
  orders: Order[];
}

export const ClientsModule: React.FC<ClientsModuleProps> = ({ orders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [filterSegment, setFilterSegment] = useState<'all' | 'vip' | 'frequent' | 'new'>('all');

  const clients = useMemo(() => {
    const clientMap = new Map<string, { 
      id: string; 
      customer: Customer; 
      orderCount: number; 
      totalSpent: number; 
      lastOrderDate: string; 
      orders: Order[] 
    }>();

    orders.forEach((order) => {
      if (order.status === 'cancelado') return; // Don't count cancelled orders
      const id = order.customer.phone || order.customer.email || order.customer.documentNumber || order.customer.name;
      
      const existing = clientMap.get(id);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
        }
        existing.orders.push(order);
      } else {
        clientMap.set(id, {
          id,
          customer: order.customer,
          orderCount: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
          orders: [order]
        });
      }
    });

    return Array.from(clientMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // KPIs
  const kpis = useMemo(() => {
    const totalClients = clients.length;
    const recurrentClients = clients.filter((c) => c.orderCount > 1).length;
    const totalSpentAll = clients.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgLtv = totalClients > 0 ? totalSpentAll / totalClients : 0;
    const topClient = clients[0] || null;

    return { totalClients, recurrentClients, avgLtv, topClient };
  }, [clients]);

  // Segment tag helper
  const getClientTier = (totalSpent: number, orderCount: number) => {
    if (totalSpent >= 400 || orderCount >= 3) {
      return {
        key: 'vip',
        label: 'VIP Joyas',
        badgeColor: 'bg-amber-400 text-stone-950 border border-amber-300 font-black',
        icon: Crown,
      };
    }
    if (orderCount >= 2) {
      return {
        key: 'frequent',
        label: 'Frecuente',
        badgeColor: 'bg-stone-900 text-stone-100 border border-stone-700',
        icon: Star,
      };
    }
    return {
      key: 'new',
      label: 'Nuevo Cliente',
      badgeColor: 'bg-stone-100 text-stone-700 border border-stone-200',
      icon: Users,
    };
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const tier = getClientTier(c.totalSpent, c.orderCount);
      const matchSegment = filterSegment === 'all' || tier.key === filterSegment;

      const q = searchQuery.toLowerCase();
      const matchSearch =
        c.customer.name.toLowerCase().includes(q) ||
        (c.customer.email && c.customer.email.toLowerCase().includes(q)) ||
        (c.customer.phone && c.customer.phone.includes(q)) ||
        (c.customer.district && c.customer.district.toLowerCase().includes(q)) ||
        (c.customer.province && c.customer.province.toLowerCase().includes(q));

      return matchSegment && matchSearch;
    });
  }, [clients, searchQuery, filterSegment]);

  const handleOpenWhatsApp = (customer: Customer, totalSpent: number) => {
    const phone = (customer.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('51') ? phone : `51${phone}`;
    const text = encodeURIComponent(
      `¡Hola ${customer.name}! ✨ Te saludamos de Obsidiana Joyería. Queríamos agradecerte por tu preferencia y consultarte si estás buscando alguna joya o diseño especial en plata fina para estos días.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">CRM & FIDELIZACIÓN</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">Directorio de Clientes</h1>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Base de datos unificada de clientes con historial de compras, valor de vida (LTV) y contacto directo vía WhatsApp.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Nombre, Teléfono, Correo..."
            className="w-full bg-stone-50 border border-stone-200 pl-10 pr-4 py-2.5 text-xs text-stone-900 rounded-xl focus:outline-none focus:border-stone-900 placeholder-stone-400"
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clientes Únicos</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl font-black text-stone-900">{kpis.totalClients}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">En registro de ventas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Recurrentes</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{kpis.recurrentClients}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {kpis.totalClients ? Math.round((kpis.recurrentClients / kpis.totalClients) * 100) : 0}% tasa de recompra
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">LTV Promedio</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">S/ {kpis.avgLtv.toFixed(0)}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Gasto medio por cliente</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cliente Top</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm font-black text-stone-900 truncate">
            {kpis.topClient ? kpis.topClient.customer.name : 'N/A'}
          </p>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">
            {kpis.topClient ? `S/ ${kpis.topClient.totalSpent.toFixed(2)} acumulado` : '-'}
          </p>
        </div>
      </div>

      {/* Segment Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200/80 shadow-xs flex items-center space-x-1.5 overflow-x-auto">
        {[
          { id: 'all', label: 'Todos los Clientes' },
          { id: 'vip', label: '👑 VIP Joyas (S/ 400+)' },
          { id: 'frequent', label: '⭐ Recurrentes (2+ pedidos)' },
          { id: 'new', label: '🌱 Nuevos Clientes' },
        ].map((tab) => {
          const isActive = filterSegment === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterSegment(tab.id as any)}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${
                  isActive
                    ? 'bg-stone-950 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-950 text-stone-200 text-[10px] uppercase tracking-wider font-black border-b border-stone-800">
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Contacto Directo</th>
                <th className="py-3.5 px-4">Ubicación</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Compras</th>
                <th className="py-3.5 px-4">Total Invertido</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-xs text-stone-900">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-700">No se encontraron clientes</p>
                    <p className="text-xs text-stone-400 mt-0.5">Comprueba el término de búsqueda o selecciona otro segmento.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const tier = getClientTier(client.totalSpent, client.orderCount);
                  const TierIcon = tier.icon;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-amber-50/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900">{client.customer.name}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Última compra: {new Date(client.lastOrderDate).toLocaleDateString('es-PE')}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-stone-800">{client.customer.phone || 'Sin teléfono'}</span>
                          {client.customer.phone && (
                            <button
                              onClick={() => handleOpenWhatsApp(client.customer, client.totalSpent)}
                              title="Chatear por WhatsApp"
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate max-w-[180px]">
                          {client.customer.email || 'Sin correo registrado'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1 text-stone-700">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>
                            {client.customer.district || 'Lima'}, {client.customer.province || 'Lima'}
                          </span>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] ${tier.badgeColor}`}>
                          <TierIcon className="w-3 h-3" />
                          <span>{tier.label}</span>
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 font-bold text-stone-800">
                        {client.orderCount} {client.orderCount === 1 ? 'pedido' : 'pedidos'}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900 text-sm">
                          S/ {client.totalSpent.toFixed(2)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Ver Historial
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

    </div>
  );
};
