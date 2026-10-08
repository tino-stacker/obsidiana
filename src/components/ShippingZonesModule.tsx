import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Globe, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Building2, 
  Compass, 
  DollarSign, 
  Trash2, 
  Edit2, 
  ShieldCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { Province, District, Zone } from '../types';

interface ShippingZonesModuleProps {
  provinces: Province[];
  districts: District[];
  zones: Zone[];
  onOpenAddZone: () => void;
  onAddDistrict: (districtData: { name: string; provinceId: string; zoneId: string }) => Promise<void>;
  onDeleteZone?: (zoneId: string) => Promise<void>;
  onUpdateZone?: (zoneId: string, updates: Partial<Zone>) => Promise<void>;
  onDeleteDistrict?: (districtId: string) => Promise<void>;
}

export const ShippingZonesModule: React.FC<ShippingZonesModuleProps> = ({
  provinces,
  districts,
  zones,
  onOpenAddZone,
  onAddDistrict,
  onDeleteZone,
  onUpdateZone,
  onDeleteDistrict,
}) => {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(provinces[0]?.id || '');
  const [newDistName, setNewDistName] = useState('');
  const [newDistZoneId, setNewDistZoneId] = useState('');
  const [isAddingDist, setIsAddingDist] = useState(false);

  // Selected Province Object
  const currentProvince = provinces.find((p) => p.id === selectedProvinceId);

  // Zones for current province
  const currentZones = zones.filter((z) => z.provinceId === selectedProvinceId);

  // Districts for current province
  const currentDistricts = districts.filter((d) => d.provinceId === selectedProvinceId);

  const handleCreateDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistName.trim() || !newDistZoneId) return;

    setIsAddingDist(true);
    try {
      await onAddDistrict({
        name: newDistName.trim(),
        provinceId: selectedProvinceId,
        zoneId: newDistZoneId,
      });
      setNewDistName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingDist(false);
    }
  };

  const handleEditZonePrice = (zone: Zone) => {
    if (!onUpdateZone) return;
    const newPrice = prompt(`Editar tarifa de envío para "${zone.name}" (S/):`, zone.shippingFee.toString());
    if (newPrice !== null && !isNaN(Number(newPrice))) {
      onUpdateZone(zone.id, { shippingFee: Number(newPrice) });
    }
  };

  const handleDeleteZoneClick = (zone: Zone) => {
    if (!onDeleteZone) return;
    if (window.confirm(`¿Estás seguro que deseas eliminar la zona "${zone.name}"? Los distritos asociados quedarán sin zona.`)) {
      onDeleteZone(zone.id);
    }
  };

  const handleDeleteDistrictClick = (district: District) => {
    if (!onDeleteDistrict) return;
    if (window.confirm(`¿Eliminar distrito "${district.name}"?`)) {
      onDeleteDistrict(district.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">LOGÍSTICA & TARIFAS</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">Zonas y Tarifas de Envío</h1>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Configuración de coberturas geográficas, precios de despacho en Soles (S/) y couriers asignados (Motorizado Express / Shalom / Olva).
          </p>
        </div>

        <button
          onClick={onOpenAddZone}
          className="flex items-center space-x-2 px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold shadow-md shadow-stone-950/10 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nueva Zona</span>
        </button>
      </div>

      {/* Logistics Overview Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Lima Express</p>
            <p className="text-sm font-black text-stone-900">Motorizado Propio / Olva</p>
            <p className="text-[10px] text-stone-500 mt-0.5">24 - 48h a Domicilio</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Provincias Nacional</p>
            <p className="text-sm font-black text-stone-900">Agencias Shalom / Olva</p>
            <p className="text-[10px] text-stone-500 mt-0.5">2 - 4 días con recojo DNI</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Empaque & Seguro</p>
            <p className="text-sm font-black text-stone-900">Estuche Joyero Rígido</p>
            <p className="text-[10px] text-stone-500 mt-0.5">Precinto de seguridad 100%</p>
          </div>
        </div>
      </div>

      {/* Province Selector Bar */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200/80 shadow-xs flex items-center space-x-1.5 overflow-x-auto">
        {provinces.map((prov) => {
          const isSelected = prov.id === selectedProvinceId;
          const zoneCount = zones.filter((z) => z.provinceId === prov.id).length;

          return (
            <button
              key={prov.id}
              onClick={() => setSelectedProvinceId(prov.id)}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer
                ${
                  isSelected
                    ? 'bg-stone-950 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }
              `}
            >
              <Compass className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
              <span>{prov.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-500'
              }`}>
                {zoneCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Zones List & Districts Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Zones & Rates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Zonas de Despacho en {currentProvince?.name}</span>
                </h3>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">Código: {currentProvince?.code}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-950 text-stone-200 text-[10px] uppercase tracking-wider font-black border-b border-stone-800">
                    <th className="py-3 px-4">Zona de Cobertura</th>
                    <th className="py-3 px-4">Tarifa de Envío</th>
                    <th className="py-3 px-4">T. de Tránsito</th>
                    <th className="py-3 px-4">Courier Asignado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                  {currentZones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        No hay zonas registradas para esta provincia todavía.
                      </td>
                    </tr>
                  ) : (
                    currentZones.map((z) => (
                      <tr key={z.id} className="hover:bg-amber-50/20 transition-colors group">
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          {z.name}
                        </td>
                        <td className="py-3.5 px-4 font-black text-amber-600 text-sm">
                          S/ {z.shippingFee.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{z.estimatedDays}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          <span className="flex items-center space-x-1">
                            <Truck className="w-3.5 h-3.5 text-stone-400" />
                            <span className="font-medium">{z.courierAssigned}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleEditZonePrice(z)}
                              className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Tarifa en Soles"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteZoneClick(z)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Zona"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: District Mapping & Add District */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Distritos en {currentProvince?.name}</span>
              </span>
              <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-bold">
                {currentDistricts.length} mapeados
              </span>
            </h3>

            {/* Districts List Tags */}
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {currentDistricts.map((d) => {
                const zObj = zones.find((z) => z.id === d.zoneId);
                return (
                  <div
                    key={d.id}
                    className="flex flex-col bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-[11px] group relative pr-7"
                  >
                    <span className="font-bold text-stone-900 truncate">{d.name}</span>
                    <span className="text-stone-500 text-[10px] truncate" title={zObj?.name}>
                      {zObj?.name || 'Sin Zona'}
                    </span>
                    <button
                      onClick={() => handleDeleteDistrictClick(d)}
                      className="absolute right-2 top-2 p-1 text-stone-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar mapeo de distrito"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {currentDistricts.length === 0 && (
                <span className="text-xs text-stone-400 col-span-2 py-4 text-center">
                  Sin distritos registrados para esta región.
                </span>
              )}
            </div>

            {/* Add District Form */}
            <div className="pt-4 border-t border-stone-100">
              <form onSubmit={handleCreateDistrict} className="space-y-3">
                <h4 className="text-[11px] font-bold text-stone-900 uppercase tracking-wider">
                  Mapear Nuevo Distrito
                </h4>
                
                <div>
                  <input
                    type="text"
                    required
                    value={newDistName}
                    onChange={(e) => setNewDistName(e.target.value)}
                    placeholder="Ej. Miraflores, San Isidro, Yanahuara..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900 placeholder-stone-400"
                  />
                </div>

                <div>
                  <select
                    required
                    value={newDistZoneId}
                    onChange={(e) => setNewDistZoneId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer font-medium"
                  >
                    <option value="" disabled>Selecciona la Zona Correspondiente</option>
                    {currentZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} - S/ {z.shippingFee.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAddingDist || currentZones.length === 0}
                  className="w-full flex items-center justify-center space-x-2 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-amber-300 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Distrito a {currentProvince?.name}</span>
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
