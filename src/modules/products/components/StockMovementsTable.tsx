import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  RotateCcw 
} from 'lucide-react';
import { StockMovement } from '../../../types';

interface StockMovementsTableProps {
  stockMovements: StockMovement[];
}

export const StockMovementsTable: React.FC<StockMovementsTableProps> = ({
  stockMovements,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4">Fecha & Hora</th>
              <th className="py-3 px-4">Joya / Producto</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Cantidad</th>
              <th className="py-3 px-4">Motivo</th>
              <th className="py-3 px-4">Registrado Por</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-xs text-zinc-600">
            {stockMovements.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  No hay movimientos de inventario registrados.
                </td>
              </tr>
            ) : (
              stockMovements.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-zinc-400">
                    {new Date(m.timestamp).toLocaleString('es-PE')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-800">
                    {m.productName}
                  </td>
                  <td className="py-3.5 px-4">
                    {m.type === 'in' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>Entrada</span>
                      </span>
                    ) : m.type === 'out' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Salida</span>
                      </span>
                    ) : m.type === 'alert' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Alerta</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        <RotateCcw className="w-3 h-3" />
                        <span>Ajuste</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-zinc-900">
                    {m.type === 'in' ? `+${m.quantity}` : m.type === 'out' ? `-${m.quantity}` : m.type === 'alert' ? '⚠' : `${m.quantity}`}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600">
                    {m.reason}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                    {m.performedBy}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
