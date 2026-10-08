import React from 'react';
import { Ban, AlertTriangle, Trash2 } from 'lucide-react';
import { Order } from '../../../types';

interface OrderAnularModalProps {
  isOpen: boolean;
  order: Order;
  anularReason: string;
  isProcessingAction: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const OrderAnularModal: React.FC<OrderAnularModalProps> = ({
  isOpen,
  order,
  anularReason,
  isProcessingAction,
  onReasonChange,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-amber-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">¿Anular Pedido {order.orderNumber}?</h3>
            <p className="text-xs text-zinc-500">El estado del pedido cambiará a "Cancelado".</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">Motivo de Anulación (opcional)</label>
          <textarea
            rows={2}
            value={anularReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ej. Cliente desistió de la compra / Error en duplicado..."
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingAction}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessingAction}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-sm disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            <span>{isProcessingAction ? 'Anulando...' : 'Confirmar Anulación'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface OrderDeleteModalProps {
  isOpen: boolean;
  order: Order;
  isProcessingAction: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const OrderDeleteModal: React.FC<OrderDeleteModalProps> = ({
  isOpen,
  order,
  isProcessingAction,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-rose-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">¿Eliminar Pedido Definitivamente?</h3>
            <p className="text-xs text-zinc-500 font-mono font-bold text-rose-600">{order.orderNumber} - {order.customer.name}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
          ⚠️ Esta acción <strong>eliminará permanentemente</strong> el registro del pedido, sus ítems y movimientos vinculados. Esta operación no se puede deshacer.
        </p>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingAction}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessingAction}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isProcessingAction ? 'Eliminando...' : 'Sí, Eliminar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
