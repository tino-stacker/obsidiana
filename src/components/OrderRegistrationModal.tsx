import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, ShoppingCart, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, Province, District, Zone, OrderItem } from '../types';

interface OrderRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  provinces: Province[];
  districts: District[];
  zones: Zone[];
  onSubmitOrder: (orderData: {
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
      province: string;
      district: string;
      zone: string;
      notes?: string;
    };
    items: OrderItem[];
    shippingFee: number;
    paymentMethod: string;
  }) => Promise<void>;
}

export const OrderRegistrationModal: React.FC<OrderRegistrationModalProps> = ({
  isOpen,
  onClose,
  products,
  provinces,
  districts,
  zones,
  onSubmitOrder,
}) => {
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState(provinces[0]?.id || '');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia BCP / Yape');

  // Selected Order Items
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  
  // Product Selector state inside form
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  // Status & Error handling
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available districts for selected province
  const availableDistricts = useMemo(() => {
    return districts.filter((d) => d.provinceId === selectedProvinceId);
  }, [districts, selectedProvinceId]);

  // Selected Zone based on district
  const calculatedZone = useMemo(() => {
    if (!selectedDistrictId) return null;
    const dist = districts.find((d) => d.id === selectedDistrictId);
    if (!dist) return null;
    return zones.find((z) => z.id === dist.zoneId) || null;
  }, [districts, zones, selectedDistrictId]);

  // Auto-fill first district when province changes
  React.useEffect(() => {
    if (availableDistricts.length > 0) {
      setSelectedDistrictId(availableDistricts[0].id);
    } else {
      setSelectedDistrictId('');
    }
  }, [selectedProvinceId, availableDistricts]);

  // Shipping Fee (Customizable)
  const [customShippingFee, setCustomShippingFee] = useState<number | ''>(15.00);
  const [isShippingCustomized, setIsShippingCustomized] = useState(false);

  // Update shippingFee when calculatedZone changes IF not manually customized
  React.useEffect(() => {
    if (!isShippingCustomized) {
      setCustomShippingFee(calculatedZone ? calculatedZone.shippingFee : 15.00);
    }
  }, [calculatedZone, isShippingCustomized]);

  const shippingFee = customShippingFee === '' ? 0 : Number(customShippingFee);

  // Subtotal & Total
  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.total, 0);
  }, [selectedItems]);

  const grandTotal = subtotal + shippingFee;

  // Add Item to List
  const handleAddItem = () => {
    setErrorMsg('');
    if (!currentProductId) {
      setErrorMsg('Selecciona un producto del catálogo.');
      return;
    }

    const prod = products.find((p) => p.id === currentProductId);
    if (!prod) return;

    if (prod.stock <= 0) {
      setErrorMsg(`El producto "${prod.name}" no tiene stock disponible.`);
      return;
    }

    // Check existing qty in list
    const existing = selectedItems.find((i) => i.productId === currentProductId);
    const totalDesiredQty = (existing ? existing.quantity : 0) + currentQty;

    if (totalDesiredQty > prod.stock) {
      setErrorMsg(`Supera el stock disponible (${prod.stock} unidades) de "${prod.name}".`);
      return;
    }

    if (existing) {
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.productId === currentProductId
            ? {
                ...item,
                quantity: totalDesiredQty,
                total: totalDesiredQty * item.unitPrice,
              }
            : item
        )
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: currentQty,
          unitPrice: prod.price,
          total: currentQty * prod.price,
        },
      ]);
    }

    // Reset picker
    setCurrentProductId('');
    setCurrentQty(1);
  };

  const handleRemoveItem = (prodId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== prodId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerEmail.trim() || !customerAddress.trim()) {
      setErrorMsg('Por favor completa el nombre, correo y dirección del cliente.');
      return;
    }

    if (selectedItems.length === 0) {
      setErrorMsg('Agrega al menos un producto al pedido.');
      return;
    }

    const provObj = provinces.find((p) => p.id === selectedProvinceId);
    const distObj = districts.find((d) => d.id === selectedDistrictId);

    setIsSubmitting(true);
    try {
      await onSubmitOrder({
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone || '+51 900 000 000',
          address: customerAddress,
          province: provObj ? provObj.name : 'Lima',
          district: distObj ? distObj.name : 'Cercado',
          zone: calculatedZone ? calculatedZone.name : 'Zona Estándar',
          notes,
        },
        items: selectedItems,
        shippingFee,
        paymentMethod,
      });

      // Reset form
      setIsShippingCustomized(false);
      setCustomShippingFee(15.00);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setNotes('');
      setSelectedItems([]);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl text-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Registrar Nuevo Pedido</h2>
              <p className="text-xs text-slate-500">Ingresa los datos del cliente, productos e información de despacho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Customer & Shipping Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-2">
                <Truck className="w-4 h-4" />
                <span>1. Datos del Cliente y Destino</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juan Carlos Pérez"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Geography Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Provincia</label>
                    <select
                      value={selectedProvinceId}
                      onChange={(e) => setSelectedProvinceId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name} ({prov.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Distrito</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      {availableDistricts.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detected Zone Banner */}
                {calculatedZone && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-blue-800">
                      <span>Zona Asignada: {calculatedZone.name}</span>
                      <span>Tarifa estándar: S/ {calculatedZone.shippingFee.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-500">Tiempo estimado: {calculatedZone.estimatedDays} | Courier: {calculatedZone.courierAssigned}</p>
                  </div>
                )}

                {/* Personalizar Costo de Envío */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Costo de Envío:</span>
                      {isShippingCustomized && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          Personalizado
                        </span>
                      )}
                    </span>
                    {isShippingCustomized && calculatedZone && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsShippingCustomized(false);
                          setCustomShippingFee(calculatedZone.shippingFee);
                        }}
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Restablecer a zona (S/ {calculatedZone.shippingFee.toFixed(2)})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">S/</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={customShippingFee === '' ? '' : customShippingFee}
                        onChange={(e) => {
                          setIsShippingCustomized(true);
                          setCustomShippingFee(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0));
                        }}
                        placeholder="0.00"
                        className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsShippingCustomized(true);
                        setCustomShippingFee(0);
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                        shippingFee === 0
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      Gratis (S/ 0)
                    </button>
                  </div>

                  {/* Preajustes rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Preajustes:</span>
                    {[
                      { label: 'S/ 0 Gratis', val: 0 },
                      { label: 'S/ 10 Lima', val: 10 },
                      { label: 'S/ 15 Express', val: 15 },
                      { label: 'S/ 18 Provincia', val: 18 },
                      { label: 'S/ 25 Urgente', val: 25 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => {
                          setIsShippingCustomized(true);
                          setCustomShippingFee(p.val);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                          shippingFee === p.val
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Dirección Exacta de Entrega *</label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Av. Principal 123, Depto / Referencia"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Método de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Transferencia BCP / Yape">Transferencia BCP / Yape</option>
                      <option value="Tarjeta de Crédito / Débito">Tarjeta Visa / Mastercard</option>
                      <option value="Pago Contraentrega">Pago Contraentrega (Efectivo/POS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Notas para Repartidor</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej. Timbre defectuoso"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Products & Items */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>2. Selección de Productos e Inventario</span>
                </h3>

                {/* Product Add Row */}
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Seleccionar del Inventario</label>
                    <select
                      value={currentProductId}
                      onChange={(e) => setCurrentProductId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="">-- Elige un producto --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} - S/ {p.price.toFixed(2)} ({p.stock <= 0 ? 'SIN STOCK' : `Stock: ${p.stock}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={currentQty}
                        onChange={(e) => setCurrentQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="w-2/3 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar al Pedido</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Products Table */}
                <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 flex justify-between">
                    <span>Producto</span>
                    <span>Total</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {selectedItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No hay productos agregados al pedido todavía.
                      </div>
                    ) : (
                      selectedItems.map((item) => (
                        <div key={item.productId} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex-1 pr-2">
                            <p className="font-semibold text-slate-800">{item.productName}</p>
                            <p className="text-slate-400">
                              SKU: {item.sku} | Cant: {item.quantity} x S/ {item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-900">S/ {item.total.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Price Totals Summary */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Productos:</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>Costo de Envío:</span>
                    <span className="text-[10px] text-slate-400">
                      ({isShippingCustomized ? 'Personalizado' : (calculatedZone ? calculatedZone.name : 'Estándar')})
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-400">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={customShippingFee === '' ? '' : customShippingFee}
                      onChange={(e) => {
                        setIsShippingCustomized(true);
                        setCustomShippingFee(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0));
                      }}
                      className="w-18 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-right text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                    {shippingFee === 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 ml-0.5">Gratis</span>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-blue-600">
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Se enviará notificación automática por correo al cliente al registrar.</span>
            </span>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-all flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Registrando...</span>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Confirmar y Crear Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
