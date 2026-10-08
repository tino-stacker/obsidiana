import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle, Sparkles, Gift, ShieldCheck } from 'lucide-react';
import { Product } from '../../../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface StorefrontCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  whatsappNumber?: string;
}

const FREE_SHIPPING_THRESHOLD = 180; // S/ 180 for free shipping

export const StorefrontCartDrawer: React.FC<StorefrontCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  whatsappNumber = '51906313634',
}) => {
  if (!isOpen) return null;

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleCheckoutWhatsApp = () => {
    let message = `¡Hola Obsidiana Joyería! ✨ Deseo coordinar el pedido de mi bolsa de compras:\n\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.quantity}x ${item.product.name}*\n   • SKU: ${item.product.sku}\n   • Precio unitario: S/ ${item.product.price.toFixed(2)}\n   • Subtotal: S/ ${(item.product.price * item.quantity).toFixed(2)}\n\n`;
    });
    message += `──────────────────\n`;
    message += `💰 *Total a Pagar:* S/ ${subtotal.toFixed(2)}\n`;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      message += `🎁 *Beneficio Aplicado:* ¡Envío Gratuito Calificado!\n`;
    }
    message += `📦 *Incluye:* Empaque de regalo y paño de limpieza.\n\n¿Me confirman los datos para pago y entrega por favor?`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#181716]/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#FDFCFB] h-full shadow-2xl flex flex-col border-l border-[#E4DFD7] z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#EBE6DF]">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#181716]" />
            <h2 className="font-serif text-xl font-normal text-[#181716]">Tu Bolsa de Compras</h2>
            <span className="text-xs bg-[#EBE6DF] text-[#61564A] font-semibold px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C8276] hover:text-[#181716] transition-colors"
            title="Cerrar bolsa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#F7F5F2] px-6 py-3.5 border-b border-[#EBE6DF]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-[#181716]">
              <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
              {subtotal >= FREE_SHIPPING_THRESHOLD
                ? '¡Felicidades! Calificas a Envío Gratis'
                : `Faltan S/ ${amountRemaining.toFixed(2)} para Envío Gratis`}
            </span>
            <span className="text-[10px] text-[#8C8276] font-mono">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-[#E4DFD7] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#181716] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-[#EBE6DF]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#F7F5F2] flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-[#A59B8F]" />
              </div>
              <h3 className="font-serif text-xl text-[#181716]">Tu bolsa está vacía</h3>
              <p className="text-xs text-[#8C8276] mt-2 max-w-xs leading-relaxed">
                Añade piezas de plata fina ley 950 y luce joyas atemporales diseñadas para perdurar.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 bg-[#181716] text-[#FDFCFB] text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#61564A] transition-colors rounded-xs shadow-sm"
              >
                Explorar Colección
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                {/* Image */}
                <div className="w-20 h-20 bg-white rounded-xs overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#E7E5E4] p-1">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-[#A8A29E]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-base text-[#181716] truncate font-medium">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-[#A59B8F] hover:text-rose-600 transition-colors p-1"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[10px] text-[#8C8276] tracking-wider uppercase mt-0.5">
                    SKU: {item.product.sku}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[#E4DFD7] rounded-xs bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="p-1 text-[#8C8276] hover:text-[#181716] hover:bg-[#F7F5F2] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-[#181716]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="p-1 text-[#8C8276] hover:text-[#181716] hover:bg-[#F7F5F2] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-serif text-base font-bold text-[#181716]">
                      S/ {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div className="p-6 bg-[#FDFCFB] border-t border-[#EBE6DF] space-y-4">
            {/* Added Perks */}
            <div className="bg-[#F7F5F2] p-3 rounded-xs flex items-center justify-between text-[11px] text-[#61564A]">
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#181716]" /> Empaque de regalo incluido
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#181716]" /> Garantía de por vida
              </span>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#8C8276]">
                <span>Subtotal ({totalCount} productos)</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#EBE6DF]">
                <span className="font-serif text-lg font-bold text-[#181716]">Total Estimado</span>
                <span className="font-serif text-2xl font-bold text-[#181716]">
                  S/ {subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full py-4 px-6 bg-[#181716] hover:bg-emerald-700 text-[#FDFCFB] font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-xs shadow-md flex items-center justify-center gap-3 group"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
              <span>Coordinar Pedido por WhatsApp</span>
            </button>

            <p className="text-[10px] text-center text-[#A59B8F] leading-tight">
              Atención directa con nuestro equipo. Pagos por Yape, Plin y transferencia bancaria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
