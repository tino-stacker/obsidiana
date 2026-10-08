import React, { useState } from 'react';
import {
  X,
  Printer,
  Truck,
  MapPin,
  Send,
  User,
  Phone,
  Building,
  Package,
  AlertTriangle,
  QrCode,
  ExternalLink,
  Check,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Order } from '../types';
import { printElement } from '../lib/printHelper';

interface PackageShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber?: string;
    receiptNumber?: string;
    trackingCode?: string;
    customer: {
      name: string;
      phone: string;
      email?: string;
      document?: string;
      docNumber?: string;
      address: string;
      reference?: string;
      province: string;
      district?: string;
      zone?: string;
      coords?: { lat: number; lng: number } | null;
    };
    shippingAgency?: string;
    deliveryType?: 'express' | 'provincia' | 'tienda';
    total: number;
    adelanto?: number;
    saldo?: number;
    items?: Array<{ productName: string; quantity: number }>;
  };
}

export const PackageShippingLabelModal: React.FC<PackageShippingLabelModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [agency, setAgency] = useState<string>(
    order.shippingAgency ||
      (order.deliveryType === 'provincia'
        ? 'SHALOM EXPRESS'
        : order.deliveryType === 'express'
        ? 'MOTORIZADO EXPRESS LIMA'
        : 'OLVA COURIER')
  );
  const [deliveryMode, setDeliveryMode] = useState<'domicilio' | 'agencia'>(
    order.deliveryType === 'provincia' ? 'agencia' : 'domicilio'
  );
  const [packageNote, setPackageNote] = useState<string>('💎 FRÁGIL - JOYERÍA EN PLATA DE ALTA PUREZA');
  const [labelFormat, setLabelFormat] = useState<'thermal' | 'a4'>('thermal');

  if (!isOpen) return null;

  const orderNumber = order.id || order.trackingCode || 'PED-2026-8942';
  const customerDoc = order.customer.docNumber || order.customer.document || 'N/I';
  const customerDistrict = order.customer.district || order.customer.zone || 'LIMA';
  const customerProvince = order.customer.province || 'LIMA';
  const coords = order.customer.coords;
  const saldoPendiente = order.saldo !== undefined ? order.saldo : 0;

  // Google Maps URL for QR Code scanning
  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${order.customer.address}, ${customerDistrict}, ${customerProvince}`
      )}`;

  // Public QR Generator API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    mapsUrl
  )}&margin=1`;

  const handlePrint = () => {
    printElement('shipping-label-print-area', `Rotulo de Envio - ${orderNumber}`);
  };

  const handleSendWhatsAppCourier = () => {
    const text = `🚚 *DATOS DE ROTULADO Y DESPACHO DE PAQUETE*
*OBSIDIANA JOYERÍA*
----------------------------------------
📦 *N° Pedido:* ${orderNumber}
🏢 *Agencia/Transporte:* ${agency}
👤 *Destinatario:* ${order.customer.name}
📄 *DNI/RUC:* ${customerDoc}
📞 *Teléfono:* ${order.customer.phone}
📍 *Destino:* ${customerProvince} - ${customerDistrict}
🏠 *Dirección:* ${order.customer.address}
🚩 *Referencia:* ${order.customer.reference || 'N/A'}
💰 *Cobrar en Destino / Saldo:* S/ ${saldoPendiente.toFixed(2)}
🗺️ *Ubicación GPS Maps:* ${mapsUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#161716] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#61564A] flex flex-col max-h-[92vh]">
        
        {/* Modal Header Controls (Non-printable) */}
        <div className="bg-[#161716] text-[#E4DFD7] p-4 flex items-center justify-between border-b border-[#61564A] print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#61564A] flex items-center justify-center text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base uppercase tracking-wide flex items-center space-x-2">
                <span>ROTULADO DE PAQUETE Y ETIQUETA DE DESPACHO</span>
              </h2>
              <p className="text-[11px] text-[#A59B8F]">
                Impresión de etiqueta para sobre o caja de envío con QR y datos GPS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#A59B8F] hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar (Non-printable) */}
        <div className="p-3.5 bg-[#24211E] border-b border-[#61564A] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs print:hidden">
          <div>
            <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">Agencia / Transporte</label>
            <select
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="w-full bg-[#161716] border border-[#61564A] text-[#E4DFD7] rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="SHALOM EXPRESS">SHALOM EXPRESS (Agencia)</option>
              <option value="OLVA COURIER">OLVA COURIER (Domicilio/Agencia)</option>
              <option value="MOTORIZADO EXPRESS LIMA">MOTORIZADO EXPRESS LIMA</option>
              <option value="MARVISUR">MARVISUR COURIER</option>
              <option value="AGENCIA CAVASSA">AGENCIA CAVASSA</option>
              <option value="AGENCIA PALOMINO">AGENCIA PALOMINO</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">Modalidad de Entrega</label>
            <div className="flex rounded-lg overflow-hidden border border-[#61564A]">
              <button
                type="button"
                onClick={() => setDeliveryMode('domicilio')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-bold transition-colors ${
                  deliveryMode === 'domicilio' ? 'bg-[#61564A] text-white' : 'bg-[#161716] text-[#A59B8F]'
                }`}
              >
                🏠 Domicilio
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('agencia')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-bold transition-colors ${
                  deliveryMode === 'agencia' ? 'bg-[#61564A] text-white' : 'bg-[#161716] text-[#A59B8F]'
                }`}
              >
                🏢 Agencia
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">Nota de Seguridad / Empaque</label>
            <input
              type="text"
              value={packageNote}
              onChange={(e) => setPackageNote(e.target.value)}
              className="w-full bg-[#161716] border border-[#61564A] text-[#E4DFD7] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-400"
              placeholder="Ej. FRÁGIL - JOYAS DE PLATA"
            />
          </div>
        </div>

        {/* PRINTABLE LABEL AREA */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200 flex-1 flex justify-center items-center">
          
          <div
            id="shipping-label-print-area"
            className={`bg-white text-slate-900 border-2 border-slate-900 p-5 rounded-lg shadow-xl w-full font-sans transition-all ${
              labelFormat === 'thermal' ? 'max-w-[480px]' : 'max-w-[620px]'
            }`}
          >
            {/* Header: Brand & Shipping Agency Bar */}
            <div className="border-b-4 border-slate-900 pb-3 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">REMITENTE / REMITTENT</span>
                <h1 className="font-serif font-black text-xl tracking-wider text-slate-900 uppercase">
                  OBSIDIANA
                </h1>
                <p className="text-[9px] font-bold text-slate-700 uppercase">JOYERÍA EN PLATA 925/950</p>
                <p className="text-[9px] font-mono text-slate-600">RUC: 20608912345 · Cel: +51 987 654 321</p>
                <p className="text-[9px] text-slate-500 truncate max-w-[220px]">Av. Primavera 120, Surco - Lima</p>
              </div>

              {/* Agency Tag Banner */}
              <div className="bg-slate-900 text-white p-2.5 rounded-lg text-right min-w-[150px]">
                <span className="text-[8px] font-extrabold tracking-widest text-amber-400 uppercase block">
                  TRANSPORTE / COURIER
                </span>
                <span className="font-extrabold text-sm sm:text-base uppercase tracking-tight block">
                  {agency}
                </span>
                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded uppercase inline-block mt-1">
                  {deliveryMode === 'agencia' ? 'RECOJO EN AGENCIA' : 'ENTREGA A DOMICILIO'}
                </span>
              </div>
            </div>

            {/* Order Tracking & Urgent Badge Bar */}
            <div className="grid grid-cols-12 gap-2 bg-slate-100 p-2 rounded-lg border border-slate-300 mb-3 text-xs">
              <div className="col-span-7">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">CÓDIGO DE SEGUIMIENTO / PEDIDO:</span>
                <span className="font-extrabold text-sm font-mono text-slate-900 tracking-wider">
                  {orderNumber}
                </span>
              </div>

              <div className="col-span-5 text-right font-mono">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">SALDO POR COBRAR:</span>
                <span className={`font-black text-sm ${saldoPendiente > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {saldoPendiente > 0 ? `S/ ${saldoPendiente.toFixed(2)}` : 'PAGADO ✓'}
                </span>
              </div>
            </div>

            {/* DESTINATARIO (RECIPIENT) - BIG CONTRAST BOX */}
            <div className="border-3 border-slate-900 rounded-xl p-4 bg-amber-50/50 mb-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                <span className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center space-x-1">
                  <User className="w-4 h-4 text-slate-900" />
                  <span>DESTINATARIO / PARA:</span>
                </span>
                <span className="text-[10px] font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">
                  {customerProvince}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">CLIENTE:</span>
                  <span className="font-black text-base text-slate-950 uppercase tracking-tight block">
                    {order.customer.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">DNI / RUC:</span>
                    <span className="font-extrabold text-slate-900 font-mono">{customerDoc}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">TELÉFONO DE CONTACTO:</span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">{order.customer.phone}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">DIRECCIÓN DE ENTREGA:</span>
                  <p className="font-extrabold text-xs text-slate-900 uppercase leading-snug">
                    {order.customer.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">DISTRITO:</span>
                    <span className="font-black text-xs text-slate-900 uppercase">{customerDistrict}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">PROVINCIA / DEP:</span>
                    <span className="font-black text-xs text-slate-900 uppercase">{customerProvince}</span>
                  </div>
                </div>

                {order.customer.reference && (
                  <div className="bg-white p-2 rounded border border-slate-300 text-[11px] font-semibold text-slate-800">
                    <span className="font-bold text-slate-500 text-[9px] uppercase block">REFERENCIA:</span>
                    {order.customer.reference}
                  </div>
                )}
              </div>
            </div>

            {/* GPS COORDINATES & QR CODE SECTION */}
            <div className="grid grid-cols-12 gap-3 border-2 border-slate-900 rounded-xl p-3 bg-slate-900 text-white items-center">
              
              {/* Left Details */}
              <div className="col-span-8 space-y-1.5">
                <div className="flex items-center space-x-1 text-amber-400 font-bold text-xs uppercase">
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>UBICACIÓN GPS Y QR DE NAVEGACIÓN</span>
                </div>

                {coords ? (
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-xs">
                    <span className="text-[9px] text-slate-400 uppercase font-sans block">Coordenadas Exactas:</span>
                    <span className="font-black text-amber-300 text-sm">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-slate-300">
                    📍 Dirección estandarizada para geolocalización.
                  </div>
                )}

                <p className="text-[9px] text-slate-300 leading-tight">
                  📷 <strong>Escanee el código QR con la cámara del celular</strong> para abrir la ruta directa en Google Maps / Waze.
                </p>
              </div>

              {/* Right QR Code Image */}
              <div className="col-span-4 flex flex-col items-center justify-center bg-white p-1.5 rounded-lg border border-slate-300">
                <img
                  src={qrCodeImageUrl}
                  alt="QR Code Google Maps"
                  className="w-24 h-24 object-contain"
                />
                <span className="text-[8px] font-extrabold text-slate-900 uppercase mt-0.5 tracking-tighter">
                  ESCANEAR MAPS
                </span>
              </div>

            </div>

            {/* Safety & Package Warning */}
            <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] font-extrabold text-slate-700">
              <span className="flex items-center space-x-1 text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{packageNote}</span>
              </span>

              <span className="text-slate-500 font-mono text-[9px]">
                EMPAQUE N° {orderNumber.slice(-4)}
              </span>
            </div>

          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-[#161716] border-t border-[#61564A] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2 text-xs text-[#A59B8F]">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Formato listo para sobre o caja de entrega</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSendWhatsAppCourier}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#61564A] hover:bg-amber-500 hover:text-slate-950 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md active:scale-95 border border-[#A59B8F]"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ IMPRIMIR ROTULADO DE PAQUETE</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
