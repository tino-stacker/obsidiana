import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Check, 
  Clock, 
  Package, 
  Truck,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Copy,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
  Gem,
  Building2
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface TrackingModuleProps {
  orders: Order[];
  initialSearchCode?: string;
}

export const TrackingModule: React.FC<TrackingModuleProps> = ({
  orders,
  initialSearchCode = '',
}) => {
  const [trackingCodeInput, setTrackingCodeInput] = useState(initialSearchCode || (orders[0]?.trackingCode || ''));
  const [foundOrder, setFoundOrder] = useState<Order | null>(
    orders.find((o) => o.trackingCode.toUpperCase() === trackingCodeInput.toUpperCase()) || orders[0] || null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const query = trackingCodeInput.trim().toUpperCase();
    if (!query) return;

    const match = orders.find(
      (o) => o.trackingCode.toUpperCase() === query || o.orderNumber.toUpperCase() === query
    );

    if (match) {
      setFoundOrder(match);
    } else {
      setFoundOrder(null);
      setErrorMsg(`No se encontró ningún pedido con el identificador "${query}". Verifica el código ingresado.`);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = (order: Order) => {
    const phone = (order.customer.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('51') ? phone : `51${phone}`;
    const trackingLink = `${window.location.origin}/#rubenasmat`;
    const text = encodeURIComponent(
      `¡Hola ${order.customer.name}! ✨ Te compartimos la información de seguimiento de tu joya en Obsidiana Joyería:\n\n` +
      `📦 Pedido: ${order.orderNumber}\n` +
      `🔍 Código de Rastreo: ${order.trackingCode}\n` +
      `📍 Estado: ${order.status.toUpperCase()}\n` +
      `🚚 Destino: ${order.customer.district || 'Lima'}, ${order.customer.province || 'Lima'}\n\n` +
      `Cualquier consulta estamos atentos por este medio.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Determine stage progress (1 to 5)
  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente': return 1;
      case 'en_preparacion': return 2;
      case 'en_ruta': return 3;
      case 'entregado': return 4;
      case 'cancelado': return -1;
      default: return 1;
    }
  };

  const currentStage = foundOrder ? getStageIndex(foundOrder.status) : 1;

  const stages = [
    {
      title: 'Orden Registrada',
      description: 'Pago recibido y orden validada en sistema.',
      icon: CheckCircle2,
    },
    {
      title: 'Taller & Empaque de Lujo',
      description: 'Inspección de plata 925/950, estuche rígido y certificado de garantía.',
      icon: Sparkles,
    },
    {
      title: 'Despachado en Ruta',
      description: 'Entregado a motorizado express o con guía Shalom/Olva.',
      icon: Truck,
    },
    {
      title: 'Entregado Conforme',
      description: 'Joya entregada en manos del cliente o agencia de destino.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[11px] font-bold">
          <Truck className="w-3.5 h-3.5 text-amber-600" />
          <span>PORTAL DE TRAZABILIDAD EN TIEMPO REAL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight uppercase">
          Rastreo de Pedidos & Envíos
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto font-light">
          Monitorea el trayecto y la preparación de cada joya desde nuestro taller hasta el destino final en Lima o agencias Shalom en provincia.
        </p>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto pt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trackingCodeInput}
              onChange={(e) => setTrackingCodeInput(e.target.value)}
              placeholder="Ingresa N° de Rastreo (TRK-...) o Pedido (NV-...)"
              className="w-full bg-stone-50 border border-stone-200 pl-10 pr-4 py-3 text-xs sm:text-sm text-stone-900 rounded-xl focus:outline-none focus:border-stone-900 font-mono tracking-wider uppercase placeholder-stone-400"
            />
          </div>
          <button
            type="submit"
            className="bg-stone-950 hover:bg-stone-800 text-amber-300 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-stone-950/10 active:scale-95"
          >
            Buscar
          </button>
        </form>

        {/* Quick Click Order Chips */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-stone-400">Recientes:</span>
          {orders.slice(0, 4).map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setTrackingCodeInput(o.trackingCode);
                setFoundOrder(o);
                setErrorMsg('');
              }}
              className={`
                px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border
                ${
                  foundOrder?.id === o.id
                    ? 'bg-amber-400 text-stone-950 border-amber-400'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border-stone-200'
                }
              `}
            >
              {o.trackingCode}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tracking Result View */}
      {foundOrder && (
        <div className="space-y-6">
          
          {/* Main Status Header Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  PEDIDO ASOCIADO
                </span>
                <div className="flex items-center space-x-3 mt-1">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                    {foundOrder.orderNumber}
                  </h2>
                  <span className="font-mono text-xs font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                    {foundOrder.trackingCode}
                  </span>
                  <button
                    onClick={() => handleCopyCode(foundOrder.trackingCode)}
                    title="Copiar código"
                    className="text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copied && <span className="text-[10px] text-emerald-600 font-bold">¡Copiado!</span>}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleShareWhatsApp(foundOrder)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Compartir por WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Visual Stepper Timeline */}
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {stages.map((stage, idx) => {
                  const isCompleted = currentStage > idx;
                  const isCurrent = currentStage === idx;
                  const Icon = stage.icon;

                  return (
                    <div
                      key={idx}
                      className={`
                        p-4 rounded-xl border transition-all relative
                        ${
                          isCompleted
                            ? 'bg-emerald-50/40 border-emerald-300 text-stone-900'
                            : isCurrent
                            ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20 text-stone-900'
                            : 'bg-stone-50/50 border-stone-200 text-stone-400'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-stone-950 font-black'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                        </span>
                        <Icon className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-amber-600' : 'text-stone-300'}`} />
                      </div>
                      <h4 className="text-xs font-black mb-1">{stage.title}</h4>
                      <p className="text-[11px] leading-relaxed opacity-80">{stage.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination & Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-stone-100">
              
              {/* Client Info */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  DESTINATARIO
                </span>
                <p className="text-sm font-black text-stone-900">{foundOrder.customer.name}</p>
                <p className="text-xs text-stone-500 flex items-center space-x-1">
                  <span>📱 {foundOrder.customer.phone || 'Sin teléfono'}</span>
                </p>
                <p className="text-xs text-stone-500 truncate">
                  ✉️ {foundOrder.customer.email || 'Sin correo'}
                </p>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  DIRECCIÓN DE ENTREGA
                </span>
                <p className="text-xs font-bold text-stone-800 flex items-start space-x-1.5">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    {foundOrder.customer.address || 'Recojo en Agencia'}
                  </span>
                </p>
                <p className="text-xs text-stone-500">
                  {foundOrder.customer.district || 'Lima'}, {foundOrder.customer.province || 'Lima'}
                </p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                  Zona: {foundOrder.customer.zone || 'Express'}
                </span>
              </div>

              {/* Joyas Incluidas */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  RESUMEN DE JOYAS ({foundOrder.items.length})
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {foundOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-stone-50">
                      <span className="font-medium text-stone-800 truncate max-w-[160px]">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-black text-stone-900">
                        S/ {item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 font-black text-xs text-stone-900">
                  <span>Total Pedido:</span>
                  <span className="text-sm text-amber-600">S/ {foundOrder.total.toFixed(2)}</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
