import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Mail, 
  User, 
  Phone, 
  Send,
  Edit2,
  Trash2,
  Ban
} from 'lucide-react';
import { Order, OrderStatus, Province, Zone } from '../../../types';
import { PackageShippingLabelModal } from '../../../components/PackageShippingLabelModal';
import { EditOrderModal } from '../../../components/EditOrderModal';
import { printElement } from '../../../lib/printHelper';
import { OrderDetailPrintableReceipt } from './OrderDetailPrintableReceipt';
import { OrderAnularModal, OrderDeleteModal } from './OrderActionModals';

export interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  onSendTestEmail?: (recipientEmail: string, recipientName: string, subject: string, bodyHtml: string) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onEditOrder?: (orderId: string, updatedData: Partial<Order>) => Promise<void>;
  onAnularOrder?: (orderId: string, reason?: string) => Promise<void>;
  provinces?: Province[];
  zones?: Zone[];
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onSendTestEmail,
  onDeleteOrder,
  onEditOrder,
  onAnularOrder,
  provinces = [],
  zones = [],
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pendiente');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState('');
  const [isShippingLabelOpen, setIsShippingLabelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAnularConfirmOpen, setIsAnularConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [anularReason, setAnularReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      setStatusNote('');
      setEmailStatusMsg('');
    }
  }, [order]);

  if (!order) return null;

  const isCancelado = order.status === 'cancelado';

  const handleStatusChange = async () => {
    setIsUpdating(true);
    setEmailStatusMsg('');
    try {
      await onUpdateStatus(order.id, selectedStatus, statusNote);
      setEmailStatusMsg(`¡Estado actualizado a "${selectedStatus.toUpperCase()}". Correo de notificación enviado al cliente!`);
      setStatusNote('');
    } catch (err: any) {
      setEmailStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintReceipt = () => {
    printElement('order-detail-printable-receipt', `Nota de Venta #${order.orderNumber}`);
  };

  const handleConfirmAnular = async () => {
    if (!onAnularOrder) return;
    setIsProcessingAction(true);
    try {
      await onAnularOrder(order.id, anularReason);
      setIsAnularConfirmOpen(false);
      setAnularReason('');
      onClose();
    } catch (e: any) {
      setEmailStatusMsg(`Error al anular: ${e.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteOrder) return;
    setIsProcessingAction(true);
    try {
      await onDeleteOrder(order.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (e: any) {
      setEmailStatusMsg(`Error al eliminar: ${e.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-sm w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl text-zinc-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-zinc-100 flex items-center justify-center font-bold text-zinc-900 border border-zinc-200">
              PED
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-zinc-900">{order.orderNumber}</h2>
                <span className="font-mono text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                  {order.trackingCode}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Registrado el {new Date(order.createdAt).toLocaleString('es-PE')}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            {/* Descargar Nota de Venta */}
            <button
              onClick={handlePrintReceipt}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 rounded-sm text-xs font-medium border border-zinc-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Descargar Nota de Venta</span>
            </button>

            {/* Editar Pedido */}
            {onEditOrder && (
              <button
                onClick={() => setIsEditing(true)}
                title="Editar datos del pedido"
                className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-sm text-xs font-semibold border border-zinc-300 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}

            {/* Anular Pedido */}
            {onAnularOrder && (
              <button
                onClick={() => setIsAnularConfirmOpen(true)}
                disabled={isCancelado}
                title={isCancelado ? 'Pedido ya anulado' : 'Anular Pedido'}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-sm text-xs font-semibold border transition-colors cursor-pointer ${
                  isCancelado
                    ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Anular</span>
              </button>
            )}

            {/* Eliminar Pedido */}
            {onDeleteOrder && (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                title="Eliminar Pedido definitivamente"
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-sm text-xs font-semibold border border-rose-200 hover:border-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-sm hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {emailStatusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{emailStatusMsg}</span>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Box */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-sm space-y-2">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>Cliente</span>
              </span>
              <p className="font-semibold text-zinc-900 text-xs">{order.customer.name}</p>
              <p className="text-xs text-zinc-500 flex items-center space-x-1">
                <Mail className="w-3 h-3 text-zinc-400" />
                <span>{order.customer.email}</span>
              </p>
              <p className="text-xs text-zinc-500 flex items-center space-x-1">
                <Phone className="w-3 h-3 text-zinc-400" />
                <span>{order.customer.phone}</span>
              </p>
            </div>

            {/* Delivery Destination Box */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-sm space-y-2">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Destino de Envío</span>
              </span>
              <p className="font-semibold text-zinc-900 text-xs">
                {order.customer.district}, {order.customer.province}
              </p>
              <p className="text-xs text-zinc-600">{order.customer.address}</p>
              <p className="text-[11px] text-zinc-400">Zona: {order.customer.zone}</p>

              {order.customer.coords && (
                <div className="mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-700 font-medium text-[11px]">
                    📍 {order.customer.coords.lat.toFixed(4)}, {order.customer.coords.lng.toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${order.customer.coords.lat},${order.customer.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-900 hover:text-blue-800 font-bold flex items-center space-x-1"
                  >
                    <span>Abrir en Maps</span>
                    <MapPin className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Logistics & Payment */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-sm space-y-2">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Logística & Pago</span>
              </span>
              <p className="text-xs text-zinc-700">
                <strong>Pago:</strong> {order.paymentMethod}
              </p>
              <p className="text-xs text-zinc-700">
                <strong>Repartidor:</strong> {order.courier?.driverName || 'Asignado en ruta'}
              </p>
              <p className="text-xs text-zinc-700">
                <strong>Vehículo:</strong> {order.courier?.vehicle || 'N/A'} ({order.courier?.licensePlate || ''})
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-zinc-200 rounded-sm overflow-hidden bg-white">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Productos del Pedido</span>
              <span>Subtotal & Envío</span>
            </div>

            <div className="divide-y divide-zinc-100 p-4 space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-zinc-800">{item.productName}</p>
                    <p className="text-zinc-400">SKU: {item.sku} | Cantidad: {item.quantity} x S/ {item.unitPrice.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-zinc-900">S/ {item.total.toFixed(2)}</span>
                </div>
              ))}

              <div className="pt-3 border-t border-zinc-200 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal:</span>
                  <span>S/ {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Envío ({order.customer.zone}):</span>
                  <span>S/ {order.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1">
                  <span>TOTAL GENERAL:</span>
                  <span>S/ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Update Order Status Control Box */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Actualizar Estado del Envío (Notifica al Cliente por Correo)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs text-zinc-600 mb-1">Nuevo Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full bg-white border border-zinc-200 rounded-sm px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_preparacion">En Preparación</option>
                  <option value="en_ruta">En Ruta de Entrega</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-600 mb-1">Nota o Comentario para el Cliente</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Ej. Entregado al conserje del edificio"
                  className="w-full bg-white border border-zinc-200 rounded-sm px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={isUpdating}
                  className="w-full bg-zinc-900 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-sm text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isUpdating ? 'Actualizando...' : 'Guardar y Notificar por Correo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Tracking Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Línea de Tiempo del Despacho (Tracking Audit)
            </h3>

            <div className="space-y-3 border-l-2 border-zinc-200 ml-3 pl-4">
              {order.timeline.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 ${
                    step.completed ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300'
                  }`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className={`text-xs font-semibold ${step.completed ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        {step.title}
                      </p>
                      {step.timestamp && (
                        <span className="text-[10px] text-zinc-400">
                          ({new Date(step.timestamp).toLocaleString('es-PE')})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{step.description}</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">📍 {step.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Package Shipping Label Modal */}
      <PackageShippingLabelModal
        isOpen={isShippingLabelOpen}
        onClose={() => setIsShippingLabelOpen(false)}
        order={{
          id: order.id,
          trackingCode: order.trackingCode,
          customer: {
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
            document: order.customer.document,
            docNumber: order.customer.documentNumber,
            address: order.customer.address,
            reference: order.customer.reference,
            province: order.customer.province,
            district: order.customer.district,
            zone: order.customer.zone,
            coords: order.customer.coords,
          },
          shippingAgency: order.customer.zone === 'Provincia (Agencia)' ? 'SHALOM EXPRESS' : 'MOTORIZADO EXPRESS LIMA',
          deliveryType: order.customer.zone === 'Provincia (Agencia)' ? 'provincia' : 'express',
          total: order.total,
          adelanto: order.adelanto,
          saldo: order.total - (order.adelanto || 0),
          items: order.items,
        }}
      />

      {/* Hidden Printable Receipt */}
      <OrderDetailPrintableReceipt order={order} />

      {/* Edit Order Modal */}
      {isEditing && onEditOrder && (
        <EditOrderModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          order={order}
          provinces={provinces}
          zones={zones}
          onSave={async (orderId, data) => {
            await onEditOrder(orderId, data);
            setIsEditing(false);
          }}
        />
      )}

      {/* Modal Confirmación Anular */}
      <OrderAnularModal
        isOpen={isAnularConfirmOpen}
        order={order}
        anularReason={anularReason}
        isProcessingAction={isProcessingAction}
        onReasonChange={setAnularReason}
        onClose={() => {
          setIsAnularConfirmOpen(false);
          setAnularReason('');
        }}
        onConfirm={handleConfirmAnular}
      />

      {/* Modal Confirmación Eliminar */}
      <OrderDeleteModal
        isOpen={isDeleteConfirmOpen}
        order={order}
        isProcessingAction={isProcessingAction}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default OrderDetailModal;
