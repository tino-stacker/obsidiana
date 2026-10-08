import React, { useState } from 'react';
import { Eye, Plus, Check, MessageCircle, Diamond, Sparkles, User, Camera } from 'lucide-react';
import { Product } from '../../../types';

interface StorefrontProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenQuickView: (product: Product) => void;
  whatsappNumber?: string;
}

export const StorefrontProductCard: React.FC<StorefrontProductCardProps> = ({
  product,
  onAddToCart,
  onOpenQuickView,
  whatsappNumber = '51906313634',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [activePhoto, setActivePhoto] = useState<'studio' | 'model'>('studio');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `¡Hola Obsidiana! Me interesa consultar la disponibilidad del modelo: *${product.name}* (SKU: ${product.sku}) - Precio: S/ ${product.price.toFixed(2)}. ¿Tienen stock disponible?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  // Decide which image to show
  const showModelImage = (isHovered && product.hoverImageUrl) || activePhoto === 'model';
  const currentImage = showModelImage && product.hoverImageUrl
    ? product.hoverImageUrl
    : product.imageUrl;

  return (
    <article
      className="group relative flex flex-col bg-white border border-[#E7E5E4] hover:border-[#1C1917] transition-all duration-300 rounded-xs overflow-hidden shadow-2xs hover:shadow-md cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenQuickView(product)}
    >
      {/* Visual Frame - High Contrast, Bright & Sharp */}
      <div className="relative aspect-square sm:aspect-[4/5] bg-white overflow-hidden flex items-center justify-center p-2">
        
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 items-start">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-[#78716C] bg-white/95 backdrop-blur-xs px-2 py-0.5 border border-[#E7E5E4] shadow-2xs">
            {product.category}
          </span>
          {isOutOfStock ? (
            <span className="text-[8px] font-bold tracking-widest uppercase text-white bg-rose-600 px-2 py-0.5 shadow-2xs">
              Agotado
            </span>
          ) : isLowStock ? (
            <span className="text-[8px] font-bold tracking-widest uppercase text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 shadow-2xs">
              Últimas {product.stock}
            </span>
          ) : null}
        </div>

        {/* View Switcher Pill (Model vs Studio) */}
        {product.hoverImageUrl && (
          <div className="absolute top-2.5 right-2.5 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhoto(activePhoto === 'studio' ? 'model' : 'studio');
              }}
              title="Alternar entre foto de estudio y modelo"
              className="bg-white/90 hover:bg-[#1C1917] text-[#1C1917] hover:text-white px-2 py-0.5 text-[8.5px] font-semibold tracking-wider uppercase rounded-xs border border-[#E7E5E4] shadow-2xs transition-colors flex items-center gap-1"
            >
              {activePhoto === 'model' ? (
                <>
                  <Camera className="w-2.5 h-2.5" />
                  <span>Estudio</span>
                </>
              ) : (
                <>
                  <User className="w-2.5 h-2.5" />
                  <span>En Modelo</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Product Image Display - Natural, Sharp, Without Dull Multiply Blends */}
        {!product.imageUrl || imageError ? (
          <div className="flex flex-col items-center justify-center text-[#A8A29E] gap-2 p-8">
            <Diamond className="w-10 h-10 stroke-1" />
            <span className="text-[9px] uppercase tracking-widest">Obsidiana</span>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentImage}
              alt={product.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className={`w-full h-full transition-all duration-500 ease-out ${
                showModelImage
                  ? 'object-cover group-hover:scale-105'
                  : 'object-contain p-2 group-hover:scale-105'
              }`}
            />
          </div>
        )}

        {/* Quick View Hover Bar */}
        <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-black/60 to-transparent text-white text-[9.5px] tracking-[0.2em] uppercase font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 hidden sm:block">
          Click para ver detalles
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2 border-t border-[#F5F5F4] bg-white">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-serif text-base sm:text-lg text-[#1C1917] group-hover:text-[#B48C36] transition-colors leading-snug line-clamp-1">
              {product.name}
            </h3>
            <span className="font-serif text-base font-bold text-[#1C1917] whitespace-nowrap">
              S/ {product.price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#A8A29E] mt-1">
            <span className="tracking-wider uppercase">Plata Fina 950 / 925</span>
            <span className="font-mono text-[9px]">{product.sku}</span>
          </div>
        </div>

        {/* Action Button: Add to Cart */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`w-full py-2.5 px-3 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.18em] uppercase transition-all duration-200 rounded-xs shadow-2xs ${
            isOutOfStock
              ? 'bg-[#F5F5F4] text-[#A8A29E] cursor-not-allowed'
              : isAdded
              ? 'bg-emerald-700 text-white'
              : 'bg-[#1C1917] text-[#FAF9F6] hover:bg-[#44403C] active:scale-[0.98]'
          }`}
        >
          {isOutOfStock ? (
            <span>Agotado</span>
          ) : isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Agregado a la bolsa</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir a la Bolsa</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
