import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  CreditCard
} from 'lucide-react';
import { Order, OrderStatus, Province, District, Zone } from '../types';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  provinces?: Province[];
  zones?: Zone[];
  onSave: (orderId: string, updatedOrderData: Partial<Order>) => Promise<void>;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  provinces = [],
  zones = [],
  onSave,
}) => {
  if (!isOpen || !order) return null;

  const [customerName, setCustomerName] = useState(order.customer.name);
  const [customerPhone, setCustomerPhone] = useState(order.customer.phone);
  const [customerEmail, setCustomerEmail] = useState(order.customer.email);
  const [customerAddress, setCustomerAddress] = useState(order.customer.address);
  const [customerDistrict, setCustomerDistrict] = useState(order.customer.district);
  const [customerProvince, setCustomerProvince] = useState(order.customer.province);
  const [customerZone, setCustomerZone] = useState(order.customer.zone);
  const [customerNotes, setCustomerNotes] = useState(order.customer.notes || '');

  const [shippingFee, setShippingFee] = useState<number>(order.shippingFee);
  const [adelanto, setAdelanto] = useState<number>(order.adelanto || 0);
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod || 'Yape');
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer.name);
      setCustomerPhone(order.customer.phone);
      setCustomerEmail(order.customer.email);
      setCustomerAddress(order.customer.address);
      setCustomerDistrict(order.customer.district);
      setCustomerProvince(order.customer.province);
      setCustomerZone(order.customer.zone);
      setCustomerNotes(order.customer.notes || '');
      setShippingFee(order.shippingFee);
      setAdelanto(order.adelanto || 0);
      setPaymentMethod(order.paymentMethod || 'Yape');
      setStatus(order.status);
      setErrorMsg('');
    }
  }, [order]);

  const subtotal = order.subtotal;
  const computedTotal = subtotal + Number(shippingFee || 0);
  const computedSaldo = Math.max(0, computedTotal - Number(adelanto || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('El nombre del cliente es obligatorio');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const updatedOrderData: Partial<Order> = {
        customer: {
          ...order.customer,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          address: customerAddress.trim(),
          district: customerDistrict.trim(),
          province: customerProvince.trim(),
          zone: customerZone.trim(),
          notes: customerNotes.trim(),
        },
        shippingFee: Number(shippingFee) || 0,
        adelanto: Number(adelanto) || 0,
        total: computedTotal,
        paymentMethod,
        status,
      };

      await onSave(order.id, updatedOrderData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#61564A]/30 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-zinc-900 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4DFD7] bg-[#181716] text-[#E4DFD7]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#61564A]/40 border border-[#A59B8F]/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#E4DFD7]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#E4DFD7]">Editar Pedido {order.orderNumber}</h2>
                <span className="font-mono text-xs text-[#181716] bg-[#E4DFD7] px-2 py-0.5 rounded font-bold">
                  {order.trackingCode}
                </span>
              </div>
              <p className="text-xs text-[#A59B8F]">Modifica los datos del cliente, estado y costos de envío</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#A59B8F] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Estado del Pedido */}
          <div className="bg-[#F8F7F5] border border-[#E4DFD7] rounded-xl p-4">
            <label className="block text-xs font-black uppercase tracking-wider text-[#61564A] mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Estado del Pedido</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['pendiente', 'en_preparacion', 'en_ruta', 'entregado', 'cancelado'] as OrderStatus[]).map((st) => {
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold uppercase transition-all flex flex-col items-center justify-center border cursor-pointer ${
                      isSelected
                        ? st === 'cancelado'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : st === 'entregado'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-[#181716] text-[#E4DFD7] border-[#181716] shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <span className="truncate">{st.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Datos del Cliente */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#61564A] flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Datos del Destinatario</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none"
                    placeholder="999 888 777"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none"
                    placeholder="cliente@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Zona / Tipo de Envío</label>
                <input
                  type="text"
                  value={customerZone}
                  onChange={(e) => setCustomerZone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none"
                  placeholder="Lima Express / Provincia (Agencia)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Dirección de Entrega</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none"
                    placeholder="Av. Los Álamos 123, Urb. Primavera"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Distrito</label>
                <input
                  type="text"
                  value={customerDistrict}
                  onChange={(e) => setCustomerDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none"
                  placeholder="Miraflores"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Provincia</label>
                <input
                  type="text"
                  value={customerProvince}
                  onChange={(e) => setCustomerProvince(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none"
                  placeholder="Lima"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Referencia / Notas de Despacho</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-[#61564A] focus:border-transparent outline-none resize-none"
                  placeholder="Frente al parque, portón negro, timbre 201..."
                />
              </div>
            </div>
          </div>

          {/* Section: Financiero / Envío */}
          <div className="bg-[#F8F7F5] border border-[#E4DFD7] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#61564A] flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Costos y Métodos de Pago</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-zinc-600">Costo de Envío (S/)</label>
                  {shippingFee === 0 && <span className="text-[10px] font-bold text-emerald-600">Gratis</span>}
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#61564A] outline-none"
                />
                <div className="flex items-center gap-1 flex-wrap mt-1.5">
                  {[
                    { label: 'Gratis S/ 0', val: 0 },
                    { label: 'S/ 10 Lima', val: 10 },
                    { label: 'S/ 15 Express', val: 15 },
                    { label: 'S/ 18 Shalom', val: 18 },
                    { label: 'S/ 25 Urgente', val: 25 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setShippingFee(p.val)}
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                        shippingFee === p.val
                          ? 'bg-[#181716] text-[#E4DFD7] border-[#181716] shadow-2xs'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Adelanto Recibido (S/)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={adelanto}
                  onChange={(e) => setAdelanto(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#61564A] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#61564A] outline-none bg-white"
                >
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                  <option value="Transferencia BCP">Transferencia BCP</option>
                  <option value="Transferencia BBVA">Transferencia BBVA</option>
                  <option value="Transferencia Interbank">Transferencia Interbank</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                </select>
              </div>
            </div>

            {/* Total Balance Summary */}
            <div className="pt-3 border-t border-zinc-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-zinc-500">Subtotal Productos: </span>
                <span className="font-bold text-zinc-800">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Saldo Pendiente: </span>
                <span className={`font-bold ${computedSaldo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {computedSaldo > 0 ? `S/ ${computedSaldo.toFixed(2)}` : 'CANCELADO'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 font-medium">TOTAL GENERAL: </span>
                <span className="text-base font-black text-zinc-900">S/ {computedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E4DFD7] bg-[#F8F7F5] flex justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-[#181716] hover:bg-[#61564A] text-[#E4DFD7] text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
