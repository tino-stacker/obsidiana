import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Truck, 
  Package, 
  Download, 
  Award,
  CheckCircle2,
  Calendar,
  Gem,
  Sparkles,
  CreditCard,
  Printer,
  FileText,
  PieChart as PieIcon
} from 'lucide-react';
import { Order, Product } from '../types';

interface ReportsModuleProps {
  orders: Order[];
  products: Product[];
}

const LUXURY_COLORS = ['#D4AF37', '#18181B', '#78716C', '#10B981', '#6366F1', '#F59E0B', '#EC4899'];

export const ReportsModule: React.FC<ReportsModuleProps> = ({ orders, products }) => {
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '7days'>('all');

  // Filter orders based on time range (excluding cancelled orders)
  const filteredOrders = useMemo(() => {
    const now = new Date().getTime();
    return orders
      .filter((o) => o.status !== 'cancelado')
      .filter((o) => {
        const orderTime = new Date(o.createdAt).getTime();
        if (timeRange === '7days') return now - orderTime <= 7 * 24 * 60 * 60 * 1000;
        if (timeRange === '30days') return now - orderTime <= 30 * 24 * 60 * 60 * 1000;
        return true;
      });
  }, [orders, timeRange]);

  // Key Performance Indicators (KPIs)
  const totalSales = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + o.total, 0);
  }, [filteredOrders]);

  const totalOrders = filteredOrders.length;

  const deliveredCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'entregado').length;
  }, [filteredOrders]);

  const deliveredRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const estimatedProfit = totalSales * 0.58; // Approx 58% jewelry gross margin

  const totalUnitsSold = useMemo(() => {
    return filteredOrders.reduce((acc, o) => {
      return acc + o.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
  }, [filteredOrders]);

  // Sales by Category Chart Data
  const categoryChartData = useMemo(() => {
    const map: Record<string, { category: string; sales: number; qty: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
        const cat = prod?.category || 'General';

        if (!map[cat]) map[cat] = { category: cat, sales: 0, qty: 0 };
        map[cat].sales += item.total;
        map[cat].qty += item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredOrders, products]);

  // Sales by Metal Purity (Plata 950 vs Plata 925)
  const metalPurityData = useMemo(() => {
    let p950Sales = 0;
    let p925Sales = 0;
    let otrosSales = 0;

    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const nameLower = item.productName.toLowerCase();
        if (nameLower.includes('950')) {
          p950Sales += item.total;
        } else if (nameLower.includes('925')) {
          p925Sales += item.total;
        } else {
          otrosSales += item.total;
        }
      });
    });

    return [
      { name: 'Plata 950 Ley', value: p950Sales || 1 },
      { name: 'Plata 925 Ley', value: p925Sales || 1 },
      ...(otrosSales > 0 ? [{ name: 'Piedras / Otros', value: otrosSales }] : []),
    ];
  }, [filteredOrders]);

  // Sales by Payment Method
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const pm = o.paymentMethod || 'Yape/Plin';
      map[pm] = (map[pm] || 0) + o.total;
    });

    return Object.keys(map).map((method) => ({
      name: method,
      value: map[method],
    }));
  }, [filteredOrders]);

  // Daily Trend
  const salesTrendData = useMemo(() => {
    const trendMap: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
      trendMap[dateKey] = (trendMap[dateKey] || 0) + o.total;
    });

    const entries = Object.entries(trendMap).map(([fecha, ventas]) => ({ fecha, ventas }));
    return entries.length > 0 ? entries : [{ fecha: 'Hoy', ventas: totalSales }];
  }, [filteredOrders, totalSales]);

  // Top Products Ranking
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productId || item.productName;
        if (!map[key]) {
          map[key] = {
            name: item.productName,
            sku: item.sku || 'OBS-PLATA',
            qty: 0,
            revenue: 0,
          };
        }
        map[key].qty += item.quantity;
        map[key].revenue += item.total;
      });
    });

    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredOrders]);

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'ID Pedido,Codigo Tracking,Cliente,Telefono,Distrito,Provincia,Total S/,Estado,Fecha\n';
    filteredOrders.forEach((o) => {
      csv += `"${o.orderNumber}","${o.trackingCode}","${o.customer.name}","${o.customer.phone || ''}","${o.customer.district || ''}","${o.customer.province || ''}",${o.total},"${o.status}","${new Date(o.createdAt).toISOString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_ventas_obsidiana_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">FINANZAS & CIERRE DE CAJA</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">Reportes & Desempeño Financiero</h1>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Métricas ejecutivas de ventas, márgenes comerciales de joyería en plata fina y comportamiento de clientes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Time range filter */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center space-x-1 border border-stone-200">
            {[
              { id: 'all', label: 'Histórico' },
              { id: '30days', label: '30 Días' },
              { id: '7days', label: '7 Días' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-stone-950 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 transition-all cursor-pointer"
            title="Descargar reporte en formato CSV compatible con Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-stone-950 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold shadow-md shadow-stone-950/10 transition-all cursor-pointer"
            title="Imprimir resumen ejecutivo"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Facturación Neta</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">S/ {totalSales.toFixed(2)}</p>
          <p className="text-[10px] text-stone-400 mt-1">{totalOrders} pedidos validados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Margen Est. Joyería</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600">S/ {estimatedProfit.toFixed(2)}</p>
          <p className="text-[10px] text-stone-400 mt-1">Margen comercial ~58%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Joyas Vendidas</span>
            <Gem className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600">{totalUnitsSold} piezas</p>
          <p className="text-[10px] text-stone-400 mt-1">En plata 925 & 950</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ticket Promedio</span>
            <ShoppingBag className="w-4 h-4 text-stone-700" />
          </div>
          <p className="text-2xl font-black text-stone-900">S/ {avgOrderValue.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">{deliveredRate}% entregados conforme</p>
        </div>
      </div>

      {/* Visual Charts Grid 1: Categories & Metals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales by Category (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200/80 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span>Ventas por Colección / Categoría (S/)</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="category" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#f5f5f4' }} 
                  formatter={(val: number) => [`S/ ${val.toFixed(2)}`, 'Ventas']}
                />
                <Bar dataKey="sales" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metal Purity Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200/80 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-stone-700" />
              <span>Pureza de Metal (Plata 950 vs 925)</span>
            </h3>
          </div>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metalPurityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metalPurityData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={LUXURY_COLORS[index % LUXURY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#f5f5f4' }} 
                  formatter={(val: number) => [`S/ ${val.toFixed(2)}`, 'Ventas']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-2 border-t border-stone-100">
            {metalPurityData.map((mp, i) => (
              <div key={mp.name} className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LUXURY_COLORS[i % LUXURY_COLORS.length] }} />
                <span className="text-stone-700 font-bold">{mp.name}: S/ {mp.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Visual Charts Grid 2: Revenue Trend & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Trend Area Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200/80 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Evolución Diaria de Ventas</span>
            </h3>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="fecha" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#f5f5f4' }} 
                  formatter={(val: number) => [`S/ ${val.toFixed(2)}`, 'Ventas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#D4AF37" fill="#D4AF3720" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200/80 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>Métodos de Pago Utilizados</span>
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {paymentMethodData.map((pm) => {
              const percent = totalSales > 0 ? Math.round((pm.value / totalSales) * 100) : 0;

              return (
                <div key={pm.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-800">
                    <span>{pm.name}</span>
                    <span className="font-mono">S/ {pm.value.toFixed(2)} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-stone-950 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Top Products Ranking Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Ranking de Joyas Más Vendidas</span>
          </h3>
          <span className="text-[11px] text-stone-400">Top 5 en unidades vendidas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-950 text-stone-200 text-[10px] font-black uppercase tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Joya / Modelo</th>
                <th className="py-3 px-4">Unidades Vendidas</th>
                <th className="py-3 px-4 text-right">Facturación Generada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400">
                    Aún no hay compras registradas en este período.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">{p.sku}</td>
                    <td className="py-3 px-4 font-black text-stone-900">{p.name}</td>
                    <td className="py-3 px-4 font-bold text-stone-700">{p.qty} un.</td>
                    <td className="py-3 px-4 font-black text-emerald-600 font-mono text-right">
                      S/ {p.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
