import React from 'react';
import { 
  Gem, 
  PackageCheck, 
  PackageX, 
  TrendingDown, 
  Boxes, 
  DollarSign 
} from 'lucide-react';

export interface InventoryKpis {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  criticalStock: number;
  healthyStock: number;
  totalUnits: number;
  totalValue: number;
}

interface InventoryKpiCardsProps {
  kpis: InventoryKpis;
  onSelectFilter: (filter: 'available' | 'out' | 'low') => void;
}

export const InventoryKpiCards: React.FC<InventoryKpiCardsProps> = ({
  kpis,
  onSelectFilter,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {/* Total Joyas */}
      <div className="bg-white border border-zinc-200 rounded-sm p-3.5 shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Joyas</span>
          <Gem className="w-4 h-4 text-zinc-800" />
        </div>
        <span className="text-2xl font-black text-zinc-900">{kpis.totalProducts}</span>
        <span className="text-[10px] text-zinc-400 font-medium">{kpis.healthyStock} en stock óptimo</span>
      </div>

      {/* En Venta / Con Stock */}
      <button
        onClick={() => onSelectFilter('available')}
        className="bg-white border border-emerald-200 rounded-sm p-3.5 shadow-sm flex flex-col gap-1.5 hover:bg-emerald-50/40 transition-colors cursor-pointer text-left"
        title="Ver joyas disponibles"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Con Stock</span>
          <PackageCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-2xl font-black text-zinc-900">{kpis.inStock}</span>
        <span className="text-[10px] text-emerald-600 font-medium">{kpis.totalUnits} unidades totales</span>
      </button>

      {/* Agotadas */}
      <button
        onClick={() => onSelectFilter('out')}
        className={`bg-white border rounded-sm p-3.5 shadow-sm flex flex-col gap-1.5 hover:bg-red-50/40 transition-colors cursor-pointer text-left ${
          kpis.outOfStock > 0 ? 'border-red-200' : 'border-zinc-200'
        }`}
        title="Ver joyas agotadas"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Agotadas</span>
          <PackageX className={`w-4 h-4 ${kpis.outOfStock > 0 ? 'text-red-600' : 'text-zinc-400'}`} />
        </div>
        <span className="text-2xl font-black text-zinc-900">{kpis.outOfStock}</span>
        <span className="text-[10px] text-zinc-400 font-medium">Sin existencias</span>
      </button>

      {/* Stock Crítico */}
      <button
        onClick={() => onSelectFilter('low')}
        className={`bg-white border rounded-sm p-3.5 shadow-sm flex flex-col gap-1.5 hover:bg-amber-50/40 transition-colors cursor-pointer text-left ${
          kpis.criticalStock > 0 ? 'border-amber-200' : 'border-zinc-200'
        }`}
        title="Ver joyas en stock crítico"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Stock Crítico</span>
          <TrendingDown className={`w-4 h-4 ${kpis.criticalStock > 0 ? 'text-amber-600' : 'text-zinc-400'}`} />
        </div>
        <span className="text-2xl font-black text-zinc-900">{kpis.criticalStock}</span>
        <span className="text-[10px] text-amber-600 font-medium">En o bajo mínimos</span>
      </button>

      {/* Unidades Totales */}
      <div className="bg-white border border-zinc-200 rounded-sm p-3.5 shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Unidades</span>
          <Boxes className="w-4 h-4 text-blue-600" />
        </div>
        <span className="text-2xl font-black text-zinc-900">{kpis.totalUnits}</span>
        <span className="text-[10px] text-zinc-400 font-medium">En almacén / tienda</span>
      </div>

      {/* Valor de Inventario */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-3.5 shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Valor Stock</span>
          <DollarSign className="w-4 h-4 text-zinc-400" />
        </div>
        <span className="text-xl font-black text-white">
          S/ {kpis.totalValue.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
        </span>
        <span className="text-[10px] text-zinc-400 font-medium">Valorización total</span>
      </div>
    </div>
  );
};
