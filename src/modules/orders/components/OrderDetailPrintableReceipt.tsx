import React from 'react';
import { Order } from '../../../types';

interface OrderDetailPrintableReceiptProps {
  order: Order;
}

export const OrderDetailPrintableReceipt: React.FC<OrderDetailPrintableReceiptProps> = ({ order }) => {
  return (
    <div id="order-detail-printable-receipt" className="hidden print:block printable-content">
      <div className="w-full border border-[#61564A] bg-white text-slate-900 overflow-hidden font-sans shadow-sm">
        {/* Top Black Header */}
        <div className="bg-[#161716] text-[#E4DFD7] p-3.5 sm:p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <img 
              src="/assets/Icono/icono-blanco.jpeg" 
              alt="Obsidiana Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-[#61564A] shrink-0" 
            />
            <div className="min-w-0">
              <h1 className="font-serif font-medium text-xl sm:text-2xl tracking-widest uppercase leading-none truncate">
                OBSIDIANA
              </h1>
              <p className="text-[8px] sm:text-[9px] font-medium text-[#A59B8F] uppercase tracking-[0.25em] mt-1">
                JOYERÍA EN PLATA 925/950
              </p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end space-y-1 shrink-0 ml-4">
            <p className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white mb-0.5">NOTA DE VENTA</p>
            <div className="bg-white text-[#161716] font-bold font-mono text-[10px] sm:text-xs px-2.5 py-1 text-center whitespace-nowrap">
              {order.orderNumber}
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-[#A59B8F] mt-0.5">FECHA: {new Date(order.createdAt).toLocaleDateString('es-PE')}</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 space-y-3">
          {/* DATOS DEL CLIENTE Box Grid */}
          <div className="grid grid-cols-12 gap-3 text-xs">
            {/* Left Details (8 cols) */}
            <div className="col-span-8 flex flex-col">
              <div className="bg-[#E4DFD7] px-3 py-1 font-bold text-[9px] text-[#161716] uppercase tracking-widest">
                DATOS DEL CLIENTE
              </div>
              <div className="border border-t-0 border-[#E4DFD7] p-2.5 space-y-2 flex-1 bg-white text-[10px]">
                <div className="flex items-center">
                  <span className="w-20 uppercase text-[8px] text-slate-500 font-bold tracking-wider">NOMBRE:</span>
                  <span className="font-semibold text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1 truncate">{order.customer.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-20 uppercase text-[8px] text-slate-500 font-bold tracking-wider">EMAIL:</span>
                  <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1 truncate">{order.customer.email || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-20 uppercase text-[8px] text-slate-500 font-bold tracking-wider">TELÉFONO:</span>
                  <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{order.customer.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-20 uppercase text-[8px] text-slate-500 font-bold tracking-wider">DIRECCIÓN:</span>
                  <span className="font-medium text-slate-900 truncate border-b border-slate-200 flex-1 pb-0.5 px-1">{order.customer.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Right Badge Card (4 cols) */}
            <div className="col-span-4 flex flex-col">
              <div className="bg-[#E4DFD7] p-2 flex flex-col items-center justify-center">
                <span className="font-bold text-[9px] text-[#161716] uppercase tracking-wider truncate">ENVÍO: {order.customer.zone || 'LIMA'}</span>
              </div>
              <div className="bg-[#F8F7F5] p-2.5 border border-t-0 border-[#E4DFD7] space-y-2 flex-1 text-[10px]">
                <div>
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">COSTO ENVÍO</p>
                  <p className="font-medium text-slate-900 border-b border-[#E4DFD7] pb-0.5">S/ {order.shippingFee.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">ADELANTO:</p>
                  <p className="font-medium text-slate-900 border-b border-[#E4DFD7] pb-0.5">S/ {(order.adelanto || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">SALDO:</p>
                  <p className="font-medium text-slate-900 border-b border-[#E4DFD7] pb-0.5">
                    {order.total - (order.adelanto || 0) > 0 ? `S/ ${(order.total - (order.adelanto || 0)).toFixed(2)} (Pendiente)` : 'CANCELADO'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[9px] border-collapse border border-[#A59B8F]">
            <thead>
              <tr className="bg-[#A59B8F] text-[#161716] font-bold uppercase tracking-wider">
                <th className="py-1.5 px-2 text-center border border-[#A59B8F] w-12">CANT.</th>
                <th className="py-1.5 px-3 border border-[#A59B8F]">PRODUCTO</th>
                <th className="py-1.5 px-2 text-center border border-[#A59B8F]">PRECIO UNIT.</th>
                <th className="py-1.5 px-3 text-center border border-[#A59B8F]">TOTAL</th>
              </tr>
            </thead>
            <tbody className="bg-white text-slate-800">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2 text-center font-medium border border-[#A59B8F]">{item.quantity}</td>
                  <td className="py-1.5 px-3 font-medium border border-[#A59B8F]">{item.productName}</td>
                  <td className="py-1.5 px-2 text-center font-medium border border-[#A59B8F]">S/ {item.unitPrice.toFixed(2)}</td>
                  <td className="py-1.5 px-3 text-center font-medium border border-[#A59B8F]">S/ {item.total.toFixed(2)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 2 - order.items.length) }).map((_, i) => (
                <tr key={`blank-${i}`} className="h-5">
                  <td className="border border-[#A59B8F]"></td>
                  <td className="border border-[#A59B8F]"></td>
                  <td className="border border-[#A59B8F]"></td>
                  <td className="border border-[#A59B8F]"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-64 flex flex-col items-end">
              <div className="flex justify-between w-full py-1 border-b border-slate-200 text-[10px]">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Subtotal:</span>
                <span className="font-semibold text-slate-900">S/ {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full py-1 border-b border-slate-200 text-[10px]">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Envío:</span>
                <span className="font-semibold text-slate-900">S/ {order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full p-2 bg-[#E4DFD7] text-[#161716] mt-1">
                <span className="text-xs font-bold uppercase tracking-widest">Total General:</span>
                <span className="text-sm font-black">
                  S/ {order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Guarantee Section */}
          <div className="mt-3 pt-3 border-t border-dashed border-[#A59B8F] text-center space-y-1">
            <p className="text-[9px] font-bold text-[#161716] uppercase tracking-widest">GARANTÍA DE AUTENTICIDAD DE POR VIDA</p>
            <p className="text-[8px] text-[#61564A]">Esta nota de venta certifica la autenticidad de sus joyas trabajadas en Plata Ley 925/950 por Obsidiana Joyería Perú.</p>
            <p className="text-[7px] text-[#A59B8F] mt-1 tracking-widest uppercase">GRACIAS POR ELEGIRNOS - @OBSIDIANA.JOYERIA</p>
          </div>
        </div>
      </div>
    </div>
  );
};
