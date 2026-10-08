import React from 'react';
import { Shield, Lock, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';

interface StorefrontFooterProps {
  onSelectCategory: (category: string) => void;
  categories: string[];
}

export const StorefrontFooter: React.FC<StorefrontFooterProps> = ({
  onSelectCategory,
  categories,
}) => {
  return (
    <footer className="bg-white text-[#78716C] border-t border-[#E7E5E4] pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#E7E5E4]">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1C1917] rounded-xs flex items-center justify-center p-1">
                <img
                  src="/assets/Icono/icono-negro.jpeg"
                  alt="Obsidiana Logo"
                  className="w-full h-full object-cover invert brightness-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-serif text-lg tracking-[0.2em] text-[#1C1917] uppercase">
                  Obsidiana
                </h3>
                <p className="text-[8.5px] uppercase tracking-[0.25em] text-[#B48C36]">
                  Joyería en Plata 950
                </p>
              </div>
            </div>

            <p className="text-xs text-[#78716C] font-light leading-relaxed">
              Joyería artesanal peruana trabajada en plata fina ley 950 y 925. Creaciones hechas a mano para acompañar tus mejores momentos.
            </p>

            <div className="pt-1 flex items-center gap-3 text-xs text-[#1C1917]">
              <span className="flex items-center gap-1.5 text-[11px] text-[#B48C36] font-medium">
                <Shield className="w-3.5 h-3.5" /> 100% Plata Legítima
              </span>
              <span className="text-[#D6D3D1]">|</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#78716C]">
                <Lock className="w-3.5 h-3.5" /> Compra Segura
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-sm text-[#1C1917] uppercase tracking-wider mb-3 font-semibold">
              Colecciones
            </h4>
            <ul className="space-y-2 text-xs font-light">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="hover:text-[#1C1917] transition-colors text-left"
                  >
                    {cat === 'all' ? 'Toda la Colección' : cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery & Attention */}
          <div>
            <h4 className="font-serif text-sm text-[#1C1917] uppercase tracking-wider mb-3 font-semibold">
              Envíos & Horarios
            </h4>
            <ul className="space-y-2.5 text-xs font-light">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#B48C36] shrink-0 mt-0.5" />
                <span>Lima Express (24h) y Provincias por Shalom y Olva</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#B48C36] shrink-0 mt-0.5" />
                <span>Lunes a Sábado: 9:00 AM – 8:00 PM</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-[#B48C36] shrink-0 mt-0.5" />
                <span>WhatsApp: +51 906 313 634</span>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="font-serif text-sm text-[#1C1917] uppercase tracking-wider mb-3 font-semibold">
              Medios de Pago
            </h4>
            <p className="text-xs text-[#78716C] mb-2.5 font-light">
              Transferencias y pagos digitales sin comisiones:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[9.5px] font-semibold uppercase">
              <span className="bg-[#FAF9F6] text-[#1C1917] px-2.5 py-1 rounded-xs border border-[#E7E5E4]">
                Yape
              </span>
              <span className="bg-[#FAF9F6] text-[#1C1917] px-2.5 py-1 rounded-xs border border-[#E7E5E4]">
                Plin
              </span>
              <span className="bg-[#FAF9F6] text-[#1C1917] px-2.5 py-1 rounded-xs border border-[#E7E5E4]">
                BCP
              </span>
              <span className="bg-[#FAF9F6] text-[#1C1917] px-2.5 py-1 rounded-xs border border-[#E7E5E4]">
                BBVA
              </span>
              <span className="bg-[#FAF9F6] text-[#1C1917] px-2.5 py-1 rounded-xs border border-[#E7E5E4]">
                Interbank
              </span>
            </div>

            <div className="mt-4">
              <a
                href="https://wa.me/51906313634?text=Hola%20Obsidiana%2C%20quisiera%20hacer%20una%20consulta%20sobre%20sus%20joyas"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chatear por WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A8A29E] font-light">
          <p>© {new Date().getFullYear()} Obsidiana Joyería. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Hecho con orfebrería en Perú</span>
            <a
              href="#rubenasmat"
              className="text-[#D6D3D1] hover:text-[#78716C] transition-colors text-[10px] uppercase"
              title="Panel Administrativo"
            >
              • Sistema POS
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
