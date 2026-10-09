import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, ShieldCheck, Gift, Truck, Sparkles, Check, Diamond } from 'lucide-react';
import { Product } from '../../../types';

interface StorefrontQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  whatsappNumber?: string;
}

export const StorefrontQuickViewModal: React.FC<StorefrontQuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  whatsappNumber = '51906313634',
}) => {
  const [selectedImage, setSelectedImage] = useState<'main' | 'hover'>('main');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen || !product) return null;

  const currentImage = selectedImage === 'hover' && product.hoverImageUrl 
    ? product.hoverImageUrl 
    : product.imageUrl;

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  const handleWhatsAppBuy = () => {
    const text = `¡Hola Obsidiana! Deseo realizar el pedido directo de:\n\n*${quantity}x ${product.name}*\n• SKU: ${product.sku}\n• Categoría: ${product.category}\n• Subtotal: S/ ${(product.price * quantity).toFixed(2)}\n\n¿Tienen disponibilidad para envío inmediato?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#181716]/60 backdrop-blur-xs transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#FDFCFB] rounded-xs shadow-2xl border border-[#E4DFD7] overflow-y-auto md:overflow-hidden z-10 max-h-[94vh] flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-30 p-1.5 sm:p-2 rounded-full bg-white/95 hover:bg-[#181716] text-[#181716] hover:text-white transition-colors shadow-xs cursor-pointer"
          title="Cerrar ventana"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Left: Image Viewer & Gallery */}
        <div className="w-full md:w-1/2 bg-white p-3 sm:p-6 flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-[#E7E5E4] shrink-0">
          {/* Main Visual Display */}
          <div className="relative w-full aspect-square max-h-[220px] sm:max-h-[340px] md:max-h-[380px] flex items-center justify-center p-2 bg-white">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.name}
                className={`w-full h-full transition-all duration-300 ${
                  selectedImage === 'hover' ? 'object-cover' : 'object-contain'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center text-[#A8A29E]">
                <Diamond className="w-12 h-12 sm:w-16 sm:h-16 stroke-1" />
                <span className="text-xs uppercase mt-2">Obsidiana Joyería</span>
              </div>
            )}
          </div>

          {/* Alternate Views / Thumbnails */}
          {product.hoverImageUrl && (
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                type="button"
                onClick={() => setSelectedImage('main')}
                className={`w-12 h-12 sm:w-16 sm:h-16 p-1 border rounded-xs transition-all overflow-hidden bg-white ${
                  selectedImage === 'main' 
                    ? 'border-[#1C1917] ring-1 ring-[#1C1917]' 
                    : 'border-[#E7E5E4] opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={product.imageUrl} 
                  alt="Vista en estudio" 
                  className="w-full h-full object-contain" 
                />
              </button>

              <button
                type="button"
                onClick={() => setSelectedImage('hover')}
                className={`w-12 h-12 sm:w-16 sm:h-16 p-1 border rounded-xs transition-all overflow-hidden bg-white ${
                  selectedImage === 'hover' 
                    ? 'border-[#1C1917] ring-1 ring-[#1C1917]' 
                    : 'border-[#E7E5E4] opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={product.hoverImageUrl} 
                  alt="Vista en modelo" 
                  className="w-full h-full object-cover" 
                />
              </button>
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Header tags */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#61564A] bg-[#EBE6DF] px-2.5 py-1">
                {product.category}
              </span>
              <span className="text-[10px] font-mono text-[#8C8276] tracking-wider">
                SKU: {product.sku}
              </span>
            </div>

            {/* Title & Price */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-[#181716] font-normal leading-tight">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="font-serif text-2xl font-bold text-[#181716]">
                  S/ {product.price.toFixed(2)}
                </span>
                <span className="text-xs text-[#8C8276] font-light">
                  Precio final con IGV incluido
                </span>
              </div>
            </div>

            {/* Material & Authenticity */}
            <div className="py-3 border-y border-[#EBE6DF] space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-[#181716]">
                <Sparkles className="w-4 h-4 text-[#C29B38]" />
                <span>Plata Fina Peruana Ley 950 / 925 Certificada</span>
              </div>
              <p className="text-[11px] text-[#8C8276] leading-relaxed">
                Joya artesanal con acabado pulido espejo y protección hipoalergénica. Ideal para uso diario o eventos especiales.
              </p>
            </div>

            {/* Quality Seals */}
            <div className="space-y-2 text-xs text-[#61564A]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#181716] shrink-0" />
                <span>Garantía permanente de pureza de plata</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-[#181716] shrink-0" />
                <span>Incluye estuche de regalo y paño de limpieza especial</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#181716] shrink-0" />
                <span>Lima Express (24h) y Provincias por Shalom / Olva</span>
              </div>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="pt-2 flex items-center gap-4">
                <span className="text-xs uppercase tracking-wider text-[#61564A] font-medium">Cantidad:</span>
                <div className="flex items-center border border-[#E4DFD7] bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-sm text-[#61564A] hover:bg-[#F7F5F2]"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-semibold text-[#181716]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-sm text-[#61564A] hover:bg-[#F7F5F2]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-6 space-y-2.5 mt-4">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3.5 px-4 flex items-center justify-center gap-2.5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-xs ${
                isOutOfStock
                  ? 'bg-[#EBE6DF] text-[#A59B8F] cursor-not-allowed'
                  : isAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#181716] text-[#FDFCFB] hover:bg-[#61564A] shadow-md'
              }`}
            >
              {isOutOfStock ? (
                <span>Agotado actualmente</span>
              ) : isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Agregado a tu bolsa!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir a la Bolsa</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppBuy}
              className="w-full py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors rounded-xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Comprar directo por WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
