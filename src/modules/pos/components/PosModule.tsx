import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  Gem, 
  Truck, 
  DollarSign, 
  Search, 
  User, 
  Edit2, 
  FileText, 
  Scan, 
  X, 
  CreditCard, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Check, 
  Store, 
  Building2, 
  RotateCcw,
  Tag,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Product, Province, District, Zone, OrderItem } from '../../../types';
import { MapLocationPickerModal } from '../../../components/MapLocationPickerModal';
import { PackageShippingLabelModal } from '../../../components/PackageShippingLabelModal';
import { ShalomBuscador } from '../../../components/ShalomBuscador';
import { AgenciaShalom } from '../../../data/shalomAgencias';
import { printElement } from '../../../lib/printHelper';
import { PosReceiptModal, PosGeneratedReceipt, PosReceiptTab } from './PosReceiptModal';
import { 
  ObsidianaLogoSvg, 
  MotorbikeIconSvg, 
  PackageBoxIconSvg 
} from './PosBrandIcons';

export { ObsidianaLogoSvg, MotorbikeIconSvg, PackageBoxIconSvg };

interface PosModuleProps {
  products: Product[];
  provinces: Province[];
  districts: District[];
  zones: Zone[];
  onSubmitOrder: (orderData: any) => Promise<void>;
  onSendTestEmail?: (email: string, name: string, subject: string, html: string) => Promise<void>;
}

// Lista oficial de distritos de Lima Metropolitana para selección rápida
const LIMA_DISTRICTS = [
  'Miraflores', 'San Isidro', 'Santiago de Surco', 'San Borja', 'Cercado de Lima',
  'Lince', 'Jesús María', 'Magdalena del Mar', 'Pueblo Libre', 'San Miguel',
  'Barranco', 'Surquillo', 'La Molina', 'Los Olivos', 'San Martín de Porres',
  'Chorrillos', 'Ate', 'Breña', 'San Juan de Lurigancho', 'San Juan de Miraflores',
  'Villa El Salvador', 'Santa Anita', 'Rímac', 'Independencia', 'Comas',
  'Callao', 'Bellavista', 'La Perla', 'La Punta', 'Carmen de la Legua'
];

export const PosModule: React.FC<PosModuleProps> = ({
  products,
  provinces,
  districts,
  zones,
  onSubmitOrder,
  onSendTestEmail,
}) => {
  // Category & Filter State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [metalFilter, setMetalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart State
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);

  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState(''); // DNI or RUC
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Shipping & Delivery State
  const [deliveryType, setDeliveryType] = useState<'tienda' | 'express' | 'provincia'>('express');
  const [limaShippingPrice, setLimaShippingPrice] = useState<number>(() => Number(localStorage.getItem('limaShippingPrice') || 10));
  const [provinciaShippingPrice, setProvinciaShippingPrice] = useState<number>(() => Number(localStorage.getItem('provinciaShippingPrice') || 18));
  
  // Custom Shipping Fee for the current sale
  const [customShippingFee, setCustomShippingFee] = useState<number | ''>(() => Number(localStorage.getItem('limaShippingPrice') || 10));
  const [isShippingCustomized, setIsShippingCustomized] = useState<boolean>(false);

  const handleSelectDeliveryType = (type: 'tienda' | 'express' | 'provincia') => {
    setDeliveryType(type);
    setIsShippingCustomized(false);
    if (type === 'tienda') {
      setCustomShippingFee(0);
    } else if (type === 'express') {
      setCustomShippingFee(limaShippingPrice);
    } else if (type === 'provincia') {
      setCustomShippingFee(provinciaShippingPrice);
    }
  };

  const handleUpdateShippingFee = (val: number | '') => {
    setIsShippingCustomized(true);
    setCustomShippingFee(val);
  };

  const handleSaveAsDefaultShippingPrice = () => {
    const feeNumber = customShippingFee === '' ? 0 : Number(customShippingFee);
    if (deliveryType === 'express') {
      setLimaShippingPrice(feeNumber);
      localStorage.setItem('limaShippingPrice', String(feeNumber));
      showToastNotice('Tarifa Lima Express guardada por defecto: S/ ' + feeNumber.toFixed(2), 'success');
    } else if (deliveryType === 'provincia') {
      setProvinciaShippingPrice(feeNumber);
      localStorage.setItem('provinciaShippingPrice', String(feeNumber));
      showToastNotice('Tarifa Provincia guardada por defecto: S/ ' + feeNumber.toFixed(2), 'success');
    }
  };
  
  // Lima Express fields
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Miraflores');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerReference, setCustomerReference] = useState('');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Provincia fields
  const [provinciaCourier, setProvinciaCourier] = useState<'shalom' | 'olva'>('shalom');
  const [selectedProvince, setSelectedProvince] = useState<string>('Arequipa');
  const [selectedAgencyBranch, setSelectedAgencyBranch] = useState<string>('');
  const [consignatarioDoc, setConsignatarioDoc] = useState('');

  // Payment & Totals State
  const [paymentMethod, setPaymentMethod] = useState<'Yape/Plin' | 'Tarjeta (Visa/MC)' | 'Transferencia BCP/Interbank' | 'Efectivo / Contraentrega'>('Yape/Plin');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [adelantoAmount, setAdelantoAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Feedback & Receipt State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPackageLabelOpen, setIsPackageLabelOpen] = useState(false);
  const [receiptTab, setReceiptTab] = useState<PosReceiptTab>('lima');
  const [generatedReceipt, setGeneratedReceipt] = useState<PosGeneratedReceipt | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Categories with count
  const categoriesList = ['Aretes', 'Conjuntos', 'Collares', 'Pulseras', 'Anillos'];

  // Calculate Shipping Fee (Customizable)
  const shippingFee = useMemo(() => {
    if (customShippingFee === '') return 0;
    return Number(customShippingFee);
  }, [customShippingFee]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category.toLowerCase() === activeCategory.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);

      let matchMetal = true;
      if (metalFilter === '950') matchMetal = p.name.includes('950');
      if (metalFilter === '925') matchMetal = p.name.includes('925');

      return matchCat && matchSearch && matchMetal;
    });
  }, [products, activeCategory, searchQuery, metalFilter]);

  // Cart Add / Quantity / Remove
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToastNotice(`⚠️ ${product.name} no cuenta con existencias disponibles.`, 'error');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToastNotice(`⚠️ Límite de stock alcanzado (${product.stock} un.).`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Cart Totals
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const total = useMemo(() => {
    const calculated = subtotal + shippingFee - discount;
    return calculated > 0 ? calculated : 0;
  }, [subtotal, shippingFee, discount]);

  // Change amount calculation
  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Efectivo / Contraentrega') return 0;
    const diff = cashTendered - total;
    return diff > 0 ? diff : 0;
  }, [paymentMethod, cashTendered, total]);

  const showToastNotice = (text: string, type: 'success' | 'error') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Quick preset helpers
  const handleApplyPresetLima = () => {
    setCustomerName('Valeria Mendoza');
    setCustomerDoc('47985621');
    setCustomerPhone('987654321');
    setCustomerEmail('valeria.mendoza@gmail.com');
    setDeliveryType('express');
    setSelectedDistrict('Miraflores');
    setCustomerAddress('Av. Larco 456, Dpto 502');
    setCustomerReference('Frente al parque Kennedy, timbre blanco');
    showToastNotice('✅ Datos de prueba Lima aplicados.', 'success');
  };

  const handleApplyPresetProvincia = () => {
    setCustomerName('Carlos Quispe');
    setCustomerDoc('70894512');
    setCustomerPhone('943210987');
    setCustomerEmail('carlos.quispe@gmail.com');
    setDeliveryType('provincia');
    setProvinciaCourier('shalom');
    setSelectedProvince('Cusco');
    setSelectedAgencyBranch('Shalom Cusco - San Sebastián (Av. Cusco 402)');
    setConsignatarioDoc('70894512');
    showToastNotice('✅ Datos de prueba Provincia Shalom aplicados.', 'success');
  };

  // Form submission: Create Order & Generate Receipt
  const handleGenerateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showToastNotice('⚠️ Agrega al menos una joya al carrito para generar la venta.', 'error');
      return;
    }

    if (!customerName.trim()) {
      showToastNotice('⚠️ Por favor ingresa el nombre del cliente.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = `NV-${Math.floor(1000 + Math.random() * 9000)}`;
      const trackingCode = `TRK-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();

      let destinationAddress = '';
      let destinationDistrict = '';
      let destinationProvince = '';
      let zoneName = '';
      let viaEnvio = '';

      if (deliveryType === 'tienda') {
        destinationAddress = 'Retiro en Showroom / Tienda';
        destinationDistrict = 'Miraflores';
        destinationProvince = 'Lima';
        zoneName = 'Tienda Showroom';
        viaEnvio = 'Recojo en Tienda Presencial';
      } else if (deliveryType === 'express') {
        destinationAddress = customerAddress.trim() || 'Lima Metropolitana';
        destinationDistrict = selectedDistrict;
        destinationProvince = 'Lima';
        zoneName = 'Lima Express Motorizado';
        viaEnvio = `Motorizado Express (${selectedDistrict})`;
      } else {
        destinationProvince = selectedProvince;
        if (provinciaCourier === 'shalom') {
          destinationAddress = selectedAgencyBranch || `Agencia Shalom ${selectedProvince}`;
          destinationDistrict = 'Agencia Shalom';
          zoneName = 'Provincia (Agencia Shalom)';
          viaEnvio = `Shalom Agencia (${selectedAgencyBranch || selectedProvince}) - DNI: ${consignatarioDoc || customerDoc}`;
        } else {
          destinationAddress = customerAddress || `Domicilio ${selectedProvince}`;
          destinationDistrict = selectedDistrict || selectedProvince;
          zoneName = 'Provincia (Olva Domicilio)';
          viaEnvio = `Olva Courier a Domicilio (${selectedProvince})`;
        }
      }

      const orderData = {
        orderNumber,
        trackingCode,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          document: customerDoc.trim().length === 11 ? 'RUC' : 'DNI',
          documentNumber: customerDoc.trim(),
          address: destinationAddress,
          district: destinationDistrict,
          province: destinationProvince,
          zone: zoneName,
          notes: customerReference || notes || 'Venta Mostrador POS',
          coords: customerCoords,
        },
        items: cartItems.map(({ product, quantity }) => ({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitPrice: product.price,
          total: product.price * quantity,
          material: product.name.includes('925') ? 'Plata 925 Ley' : 'Plata 950 Ley',
        })),
        subtotal,
        shippingFee,
        discount,
        total,
        adelanto: adelantoAmount,
        status: 'en_preparacion',
        paymentMethod,
        notes,
      };

      await onSubmitOrder(orderData);

      // Setup Receipt Modal Object
      const saldoAmount = total - adelantoAmount;
      const receiptObj: PosGeneratedReceipt = {
        orderNumber,
        trackingCode,
        receiptNumber: orderNumber,
        date: now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        customer: {
          name: customerName.trim(),
          doc: customerDoc.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          address: destinationAddress,
          reference: customerReference.trim(),
          province: destinationProvince,
          district: destinationDistrict,
          coords: customerCoords,
        },
        items: cartItems.map(({ product, quantity }) => ({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitPrice: product.price,
          total: product.price * quantity,
          material: product.name.includes('925') ? 'Plata 925' : 'Plata 950',
        })),
        subtotal,
        shippingFee,
        discount,
        total,
        adelanto: adelantoAmount,
        saldo: saldoAmount > 0 ? saldoAmount : 0,
        saldoTexto: saldoAmount > 0 ? (deliveryType === 'express' ? 'Pagar al Motorizado' : 'Contraentrega') : 'Cancelado',
        paymentMethod,
        deliveryType,
        viaEnvio,
        cashTendered: paymentMethod === 'Efectivo / Contraentrega' ? cashTendered : undefined,
        changeAmount: paymentMethod === 'Efectivo / Contraentrega' ? changeAmount : undefined,
      };

      setGeneratedReceipt(receiptObj);
      setReceiptTab(deliveryType === 'provincia' ? 'provincia' : 'lima');
      showToastNotice(`🎉 ¡Venta ${orderNumber} registrada con éxito!`, 'success');

    } catch (err: any) {
      console.error(err);
      showToastNotice(`Error al registrar venta: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    printElement('printable-receipt', `Nota de Venta #${generatedReceipt?.orderNumber || ''}`);
  };

  const handleSendWhatsApp = () => {
    if (!generatedReceipt) return;
    const phone = (generatedReceipt.customer.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('51') ? phone : `51${phone}`;
    const msg = `*OBSIDIANA JOYERÍA PERÚ - NOTA DE VENTA ${generatedReceipt.receiptNumber}*\n\n` +
      `¡Hola ${generatedReceipt.customer.name}! Gracias por elegir nuestras joyas en plata fina.\n\n` +
      `📦 *Resumen de tu compra:*\n` +
      generatedReceipt.items.map((i) => `• ${i.quantity}x ${i.productName} (${i.material || 'Plata 950'}) - S/ ${i.total.toFixed(2)}`).join('\n') +
      `\n\n*SUBTOTAL:* S/ ${generatedReceipt.subtotal.toFixed(2)}\n` +
      `*ENVÍO:* S/ ${generatedReceipt.shippingFee.toFixed(2)}\n` +
      `*TOTAL:* S/ ${generatedReceipt.total.toFixed(2)}\n` +
      (generatedReceipt.saldo > 0 ? `*SALDO PENDIENTE:* S/ ${generatedReceipt.saldo.toFixed(2)} (${generatedReceipt.saldoTexto})\n` : `*ESTADO:* PAGADO COMPLETO ✅\n`) +
      `*MODALIDAD DE ENTREGA:* ${generatedReceipt.viaEnvio}\n` +
      `*CÓDIGO DE RASTREO:* ${generatedReceipt.trackingCode}\n\n` +
      `✨ Incluye estuche de lujo y certificado de autenticidad de plata 925/950.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleResetForNewSale = () => {
    setGeneratedReceipt(null);
    setCartItems([]);
    setCustomerName('');
    setCustomerDoc('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerReference('');
    setConsignatarioDoc('');
    setCashTendered(0);
    setAdelantoAmount(0);
    setDiscount(0);
    setNotes('');
    setIsShippingCustomized(false);
    setCustomShippingFee(limaShippingPrice);
    setDeliveryType('express');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Notification Toast */}
      {notificationMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg transition-all sticky top-16 z-30 ${
          notificationMsg.type === 'success' ? 'bg-emerald-950 text-emerald-200 border border-emerald-800' : 'bg-rose-950 text-rose-200 border border-rose-800'
        }`}>
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-stone-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Catalog (Left) + Unified Checkout Terminal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================
            LEFT COLUMN: CATALOGO VISUAL DE JOYERIA (7 Cols)
           ======================================================== */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          
          {/* Header Controls: Search & Category Pills */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5">
            
            {/* Top Row: Title + Integrated Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <Gem className="w-5 h-5 text-amber-500" />
                  <span>Catálogo de Joyas</span>
                  <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                    {filteredProducts.length} disponibles
                  </span>
                </h1>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Toca cualquier joya para añadirla de inmediato al comprobante de venta.
                </p>
              </div>

              {/* Fast Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por joya o SKU..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 text-stone-900 placeholder-stone-400"
                />
              </div>
            </div>

            {/* Category Pills Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-stone-950 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                Todas ({products.length})
              </button>

              {categoriesList.map((cat) => {
                const count = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
                const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat.toLowerCase())}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-stone-950 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Metal Filter Pills */}
            <div className="flex items-center space-x-2 pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-400 text-[11px] font-bold uppercase">Material:</span>
              {[
                { id: 'all', label: 'Todos los metales' },
                { id: '950', label: 'Plata 950 Ley' },
                { id: '925', label: 'Plata 925 Ley' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetalFilter(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    metalFilter === m.id
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-500 hover:text-stone-900 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

          </div>

          {/* Product Cards Grid with Real Jewelry Photos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[680px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-2xl border border-stone-200/80">
                <Gem className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="font-bold text-stone-700">No se encontraron joyas en esta sección</p>
                <p className="text-xs text-stone-400 mt-0.5">Prueba buscando otro término o seleccionando otra categoría.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCartItem = cartItems.find((ci) => ci.product.id === p.id);
                const isOutStock = p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutStock && handleAddToCart(p)}
                    className={`
                      group relative bg-white border rounded-2xl p-3 flex flex-col justify-between shadow-xs transition-all overflow-hidden cursor-pointer
                      ${
                        inCartItem
                          ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20'
                          : 'border-stone-200/80 hover:border-stone-400 hover:shadow-md'
                      }
                      ${isOutStock ? 'opacity-70 cursor-not-allowed' : 'active:scale-98'}
                    `}
                  >
                    {/* Real Product Image Container */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 mb-2.5 flex items-center justify-center">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Gem className="w-10 h-10 text-stone-300" />
                      )}

                      {/* Metal Purity Tag (Over Image) */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-xs text-[9px] font-bold text-amber-300 border border-amber-500/30">
                        {p.name.includes('925') ? 'Plata 925' : 'Plata 950'}
                      </div>

                      {/* Stock Badge (Over Image) */}
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black ${
                        isOutStock
                          ? 'bg-rose-500 text-white'
                          : inCartItem
                          ? 'bg-emerald-500 text-white'
                          : 'bg-stone-900/80 text-stone-200'
                      }`}>
                        {isOutStock ? 'Agotado' : `${p.stock} un.`}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-1 mb-2">
                      <div className="font-mono text-[10px] text-stone-400 font-bold uppercase">
                        {p.sku}
                      </div>
                      <h3 className="font-bold text-xs text-stone-900 line-clamp-1 leading-snug" title={p.name}>
                        {p.name}
                      </h3>
                    </div>

                    {/* Price and Cart Stepper / Add Button */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                      <div className="font-black text-sm text-stone-950">
                        S/ {p.price.toFixed(2)}
                      </div>

                      {inCartItem ? (
                        <div className="flex items-center bg-stone-950 text-white rounded-lg p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p.id, -1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs px-2 text-amber-300">
                            {inCartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p.id, 1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutStock}
                          onClick={() => handleAddToCart(p)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-950 hover:text-amber-300 text-stone-900 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ========================================================
            RIGHT COLUMN: TERMINAL DE VENTA & DESPACHO (5 Cols)
           ======================================================== */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          
          <form onSubmit={handleGenerateReceipt} className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-5">
            
            {/* Header: Ticket Title + Item Count */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-stone-900 uppercase tracking-wide">
                    Ticket de Venta
                  </h2>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {cartItems.reduce((acc, i) => acc + i.quantity, 0)} joyas seleccionadas
                  </p>
                </div>
              </div>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="py-6 text-center text-stone-400 space-y-1">
                  <ShoppingBag className="w-7 h-7 mx-auto text-stone-300" />
                  <p className="text-xs font-bold text-stone-700">El carrito está vacío</p>
                  <p className="text-[10px] text-stone-400">Selecciona joyas del catálogo a la izquierda.</p>
                </div>
              ) : (
                cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2"
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Gem className="w-5 h-5 m-auto text-stone-400 mt-2.5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-stone-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-stone-500">
                        S/ {product.price.toFixed(2)} c/u · <span className="font-mono font-bold text-amber-700">{product.sku}</span>
                      </p>
                    </div>

                    {/* Stepper & Price */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(product.id, -1)}
                          className="w-5 h-5 text-stone-700 hover:bg-stone-100 rounded flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-stone-900">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(product.id, 1)}
                          className="w-5 h-5 text-stone-700 hover:bg-stone-100 rounded flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-black text-xs text-stone-900 w-16 text-right">
                        S/ {(product.price * quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(product.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Quitar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* SECTION 1: DATOS DEL CLIENTE */}
            <div className="space-y-2.5 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>1. Datos del Comprador</span>
                </span>

                {/* Quick Presets */}
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleApplyPresetLima}
                    className="text-[10px] font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                  >
                    ⚡ Test Lima
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPresetProvincia}
                    className="text-[10px] font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                  >
                    ⚡ Test Shalom
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Valeria Mendoza"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Celular / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="987 654 321"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-600 block mb-0.5">DNI o RUC</label>
                  <input
                    type="text"
                    value={customerDoc}
                    onChange={(e) => setCustomerDoc(e.target.value)}
                    placeholder="47985621"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Correo (Opcional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="cliente@gmail.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: MODALIDAD DE ENVÍO REDISEÑADA */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Modalidad de Envío & Destino</span>
              </span>

              {/* 3 Main Shipping Modes */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectDeliveryType('tienda')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    deliveryType === 'tienda'
                      ? 'bg-stone-950 text-white border-stone-950 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Store className={`w-4 h-4 ${deliveryType === 'tienda' ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span className="font-bold text-xs">En Tienda</span>
                  <span className={`text-[10px] font-semibold ${deliveryType === 'tienda' ? 'text-stone-400' : 'text-stone-400'}`}>
                    Gratis
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDeliveryType('express')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    deliveryType === 'express'
                      ? 'bg-stone-950 text-white border-stone-950 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <MotorbikeIconSvg className={`w-4 h-4 ${deliveryType === 'express' ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span className="font-bold text-xs">Lima Express</span>
                  <span className={`text-[10px] font-black ${deliveryType === 'express' ? 'text-amber-300' : 'text-amber-700'}`}>
                    S/ {deliveryType === 'express' && isShippingCustomized ? shippingFee.toFixed(2) : limaShippingPrice}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDeliveryType('provincia')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    deliveryType === 'provincia'
                      ? 'bg-stone-950 text-white border-stone-950 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${deliveryType === 'provincia' ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span className="font-bold text-xs">Provincia</span>
                  <span className={`text-[10px] font-black ${deliveryType === 'provincia' ? 'text-amber-300' : 'text-amber-700'}`}>
                    S/ {deliveryType === 'provincia' && isShippingCustomized ? shippingFee.toFixed(2) : provinciaShippingPrice}
                  </span>
                </button>
              </div>

              {/* Sub-form 1: Retiro en Tienda */}
              {deliveryType === 'tienda' && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-stone-800">🏬 Retiro en Showroom / Tienda Central</p>
                  <p className="text-[11px] text-stone-500 font-light">
                    El cliente recogerá su joya en tienda. Se le enviará la Nota de Venta por WhatsApp.
                  </p>
                </div>
              )}

              {/* Sub-form 2: Lima Metropolitana Express */}
              {deliveryType === 'express' && (
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Destino Lima Metropolitana & Callao</span>
                    </span>
                    <span className="text-[10px] font-bold text-stone-500">Motorizado 24h</span>
                  </div>

                  {/* Distrito Dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Distrito de Entrega *</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
                    >
                      {LIMA_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Dirección Exacta *</label>
                    <input
                      type="text"
                      required={deliveryType === 'express'}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Ej. Av. Larco 456, Dpto. 502"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* Referencia */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Referencia de Entrega</label>
                    <input
                      type="text"
                      value={customerReference}
                      onChange={(e) => setCustomerReference(e.target.value)}
                      placeholder="Ej. Altura parque Kennedy, timbre blanco"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* Pin GPS Opcional */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className="text-[11px] font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>🗺️ Fijar ubicación en mapa GPS</span>
                      {customerCoords && <span className="text-emerald-600 font-bold">(Fijado)</span>}
                    </button>

                    {customerCoords && (
                      <button
                        type="button"
                        onClick={() => setCustomerCoords(null)}
                        className="text-[10px] text-rose-600 underline"
                      >
                        Quitar GPS
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-form 3: Provincias (Shalom / Olva) */}
              {deliveryType === 'provincia' && (
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-800">
                      Envíos a Provincias (Todo el Perú)
                    </span>
                    <span className="text-[10px] font-bold text-amber-700">Embalaje reforzado</span>
                  </div>

                  {/* Selector Shalom vs Olva */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProvinciaCourier('shalom')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        provinciaCourier === 'shalom'
                          ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>🟡 Shalom (Agencia)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvinciaCourier('olva')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        provinciaCourier === 'olva'
                          ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>🔵 Olva Courier</span>
                    </button>
                  </div>

                  {/* Si es Shalom */}
                  {provinciaCourier === 'shalom' && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-0.5">
                          Departamento / Ciudad de Destino *
                        </label>
                        <select
                          value={selectedProvince}
                          onChange={(e) => setSelectedProvince(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
                        >
                          {['Arequipa', 'Cusco', 'La Libertad (Trujillo)', 'Piura', 'Lambayeque (Chiclayo)', 'Junín (Huancayo)', 'Ica', 'Áncash (Chimbote/Huaraz)', 'Puno', 'Tacna', 'San Martín (Tarapoto)', 'Ucayali (Pucallpa)', 'Loreto (Iquitos)'].map((dep) => (
                            <option key={dep} value={dep}>{dep}</option>
                          ))}
                        </select>
                      </div>

                      {/* Buscador de Agencia Shalom */}
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-0.5">
                          Agencia Shalom para Recojo *
                        </label>
                        <ShalomBuscador
                          selectedNombre={selectedAgencyBranch}
                          onSelect={(a: AgenciaShalom) => {
                            if (!a.nombre) {
                              setSelectedAgencyBranch('');
                              return;
                            }
                            setSelectedAgencyBranch(`${a.nombre} – ${a.distrito}, ${a.provincia}`);
                            setSelectedProvince(a.provincia);
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-0.5">
                          DNI del Consignatario (Quien recoge en ventanilla) *
                        </label>
                        <input
                          type="text"
                          required={deliveryType === 'provincia' && provinciaCourier === 'shalom'}
                          value={consignatarioDoc || customerDoc}
                          onChange={(e) => setConsignatarioDoc(e.target.value)}
                          placeholder="DNI de la persona que recoge"
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900 font-mono"
                        />
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Shalom requiere DNI físico original para entregar el paquete.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Si es Olva Courier */}
                  {provinciaCourier === 'olva' && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Ciudad / Provincia *</label>
                          <input
                            type="text"
                            required={deliveryType === 'provincia' && provinciaCourier === 'olva'}
                            value={selectedProvince}
                            onChange={(e) => setSelectedProvince(e.target.value)}
                            placeholder="Ej. Arequipa, Trujillo..."
                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Distrito *</label>
                          <input
                            type="text"
                            required={deliveryType === 'provincia' && provinciaCourier === 'olva'}
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            placeholder="Ej. Cayma, Yanahuara..."
                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Dirección de Entrega a Domicilio *</label>
                        <input
                          type="text"
                          required={deliveryType === 'provincia' && provinciaCourier === 'olva'}
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Calle, número, urbanización..."
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Personalización de Costo de Envío */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-black text-stone-800 tracking-tight">Costo de Envío</span>
                    {isShippingCustomized && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                        Personalizado
                      </span>
                    )}
                  </div>
                  
                  {isShippingCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsShippingCustomized(false);
                        if (deliveryType === 'tienda') setCustomShippingFee(0);
                        else if (deliveryType === 'express') setCustomShippingFee(limaShippingPrice);
                        else setCustomShippingFee(provinciaShippingPrice);
                      }}
                      className="text-[10px] font-bold text-amber-900 hover:text-stone-900 underline cursor-pointer"
                    >
                      Restablecer estándar (S/ {deliveryType === 'tienda' ? 0 : deliveryType === 'express' ? limaShippingPrice : provinciaShippingPrice})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-stone-400">
                      S/
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.50"
                      value={customShippingFee === '' ? '' : customShippingFee}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        handleUpdateShippingFee(val);
                      }}
                      placeholder="0.00"
                      className="w-full bg-white border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-xs font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-stone-900 shadow-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateShippingFee(0)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      shippingFee === 0
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    Envío Gratis (S/ 0)
                  </button>

                  {deliveryType !== 'tienda' && (
                    <button
                      type="button"
                      title="Guardar este costo como tarifa predeterminada para futuras ventas"
                      onClick={handleSaveAsDefaultShippingPrice}
                      className="px-2.5 py-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-700 hover:text-stone-900 cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>💾 Fijar tarifa fija</span>
                    </button>
                  )}
                </div>

                {/* Preajustes rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-stone-400 mr-0.5">Tarifas rápidas:</span>
                  {[
                    { label: 'S/ 0 (Gratis)', val: 0 },
                    { label: 'S/ 10 (Lima)', val: 10 },
                    { label: 'S/ 12', val: 12 },
                    { label: 'S/ 15 (Express)', val: 15 },
                    { label: 'S/ 18 (Shalom)', val: 18 },
                    { label: 'S/ 22 (Olva)', val: 22 },
                    { label: 'S/ 25 (Urgente)', val: 25 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleUpdateShippingFee(preset.val)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        shippingFee === preset.val
                          ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-xs font-black'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 3: MÉTODO DE PAGO */}
            <div className="space-y-2.5 pt-2 border-t border-stone-100">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>3. Método de Pago</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Yape/Plin', label: '🟣 Yape / Plin' },
                  { id: 'Transferencia BCP/Interbank', label: '🏦 Transferencia' },
                  { id: 'Tarjeta (Visa/MC)', label: '💳 Tarjeta POS' },
                  { id: 'Efectivo / Contraentrega', label: '💵 Efectivo' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                      paymentMethod === m.id
                        ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Si es efectivo: Calculadora de vuelto */}
              {paymentMethod === 'Efectivo / Contraentrega' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Monto recibido del cliente:</span>
                    <input
                      type="number"
                      min={0}
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-24 bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-amber-200/60">
                    <span className="text-stone-600">Vuelto a entregar:</span>
                    <span className={`text-sm font-black ${changeAmount > 0 ? 'text-emerald-700' : 'text-stone-400'}`}>
                      S/ {changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: DESGLOSE DE TOTALES & BOTÓN DE ACCIÓN */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Subtotal Joyas:</span>
                <span className="font-bold text-stone-900">S/ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="flex items-center gap-1">
                  <span>Costo de Envío:</span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    ({deliveryType === 'tienda' ? 'Tienda' : deliveryType === 'express' ? 'Lima' : 'Provincia'})
                  </span>
                  {isShippingCustomized && (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                      Personalizado
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-400 text-xs">S/</span>
                  <input
                    type="number"
                    min={0}
                    step="0.50"
                    value={customShippingFee === '' ? '' : customShippingFee}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      handleUpdateShippingFee(val);
                    }}
                    placeholder="0.00"
                    className="w-20 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-stone-900 rounded-lg px-2 py-0.5 text-xs font-black text-right text-stone-900 focus:outline-none transition-all shadow-2xs"
                  />
                  {shippingFee === 0 && (
                    <span className="text-[10px] font-black text-emerald-600 ml-0.5">Gratis</span>
                  )}
                </div>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-xs text-rose-600 font-bold">
                  <span>Descuento aplicado:</span>
                  <span>- S/ {discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                    TOTAL A COBRAR
                  </span>
                  <span className="text-2xl font-black text-stone-950">
                    S/ {total.toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="px-6 py-3.5 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-amber-300 rounded-xl text-xs font-black shadow-lg shadow-stone-950/20 transition-all cursor-pointer flex items-center space-x-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'Procesando...' : 'GENERAR NOTA DE VENTA'}</span>
                </button>
              </div>
            </div>

          </form>

        </div>

      </div>

      {/* Map Location Picker Modal (GPS) */}
      <MapLocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialCoords={customerCoords || { lat: -12.0894, lng: -77.0335 }}
        onSelectCoords={(coords, snippet) => {
          setCustomerCoords(coords);
          if (snippet && !customerReference) {
            setCustomerReference(`GPS: ${snippet}`);
          }
          setIsMapModalOpen(false);
        }}
      />

      {/* POS Receipt Modal (Ticket A4 / Térmico / WhatsApp) */}
      <PosReceiptModal
        receipt={generatedReceipt}
        receiptTab={receiptTab}
        shippingAgency={deliveryType === 'provincia' ? (provinciaCourier === 'shalom' ? 'Shalom' : 'Olva') : 'Motorizado Express'}
        onSelectTab={(tab) => setReceiptTab(tab)}
        onClose={() => setGeneratedReceipt(null)}
        onPrint={handlePrintReceipt}
        onOpenPackageLabel={() => setIsPackageLabelOpen(true)}
        onSendWhatsApp={handleSendWhatsApp}
        onNewSale={handleResetForNewSale}
      />

      {/* Package Shipping Label Modal */}
      {isPackageLabelOpen && generatedReceipt && (
        <PackageShippingLabelModal
          isOpen={isPackageLabelOpen}
          onClose={() => setIsPackageLabelOpen(false)}
          order={{
            id: generatedReceipt.orderNumber,
            orderNumber: generatedReceipt.orderNumber,
            trackingCode: generatedReceipt.trackingCode,
            customer: {
              name: generatedReceipt.customer.name,
              phone: generatedReceipt.customer.phone,
              email: generatedReceipt.customer.email,
              document: generatedReceipt.customer.doc.length === 11 ? 'RUC' : 'DNI',
              docNumber: generatedReceipt.customer.doc,
              address: generatedReceipt.customer.address,
              reference: generatedReceipt.customer.reference,
              province: generatedReceipt.customer.province,
              district: generatedReceipt.customer.district,
              zone: deliveryType === 'provincia' ? 'Provincia (Agencia)' : 'Lima Express',
              coords: generatedReceipt.customer.coords,
            },
            shippingAgency: deliveryType === 'provincia' ? 'SHALOM EXPRESS' : 'MOTORIZADO EXPRESS LIMA',
            deliveryType: deliveryType === 'provincia' ? 'provincia' : 'express',
            total: generatedReceipt.total,
            adelanto: generatedReceipt.adelanto,
            saldo: generatedReceipt.saldo,
            items: generatedReceipt.items,
          }}
        />
      )}

    </div>
  );
};

export default PosModule;
