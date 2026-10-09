import React, { useState } from 'react';
import { Eye, ArrowRight, Sparkles, Diamond, ShoppingBag } from 'lucide-react';
import { Product } from '../../../types';

interface StorefrontHeroBannerProps {
  onSelectCategory: (category: string) => void;
  onOpenQuickView: (product: Product) => void;
  products: Product[];
}

interface BannerModelItem {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  lifestyleImage: string;
  studioImage: string;
  badge: string;
  description: string;
}

const FEATURED_BANNER_MODELS: BannerModelItem[] = [
  {
    id: 'prod-col-022',
    name: 'Nudo de Bruja',
    category: 'Collares',
    material: 'Plata Ley 950',
    price: 89,
    lifestyleImage: '/productos/prod-col-022-hover.jpeg',
    studioImage: '/productos/prod-col-022.jpeg',
    badge: 'MÁS VENDIDO',
    description: 'Símbolo ancestral de protección tallado en plata maciza.',
  },
  {
    id: 'prod-con-019',
    name: 'Conjunto Perla Circón',
    category: 'Conjuntos',
    material: 'Plata Ley 925',
    price: 89,
    lifestyleImage: '/productos/prod-con-019-hover.jpeg',
    studioImage: '/productos/prod-con-019.jpeg',
    badge: 'FAVORITO',
    description: 'Perla cultivada con destellos de circones de alta pureza.',
  },
  {
    id: 'prod-are-001',
    name: 'Aretes Conchita',
    category: 'Aretes',
    material: 'Plata Ley 950',
    price: 59,
    lifestyleImage: '/productos/prod-are-001-hover.jpeg',
    studioImage: '/productos/prod-are-001.jpeg',
    badge: 'NUEVA EDICIÓN',
    description: 'Diseño orgánico marino con acabado pulido brillante.',
  },
  {
    id: 'prod-pul-039',
    name: 'Pulsera Tres Lazos',
    category: 'Pulseras',
    material: 'Plata Ley 950',
    price: 149,
    lifestyleImage: '/productos/prod-pul-039-hover.jpeg',
    studioImage: '/productos/prod-pul-039.jpeg',
    badge: 'EXCLUSIVO',
    description: 'Eslabones triples entrelazados de presencia imponente.',
  },
];

export const StorefrontHeroBanner: React.FC<StorefrontHeroBannerProps> = ({
  onSelectCategory,
  onOpenQuickView,
  products,
}) => {
  // Track which view (lifestyle on model vs studio close-up) is active per card
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewModes, setViewModes] = useState<Record<string, 'lifestyle' | 'studio'>>({
    'prod-col-022': 'lifestyle',
    'prod-con-019': 'lifestyle',
    'prod-are-001': 'lifestyle',
    'prod-pul-039': 'lifestyle',
  });

  const toggleViewMode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewModes((prev) => ({
      ...prev,
      [id]: prev[id] === 'studio' ? 'lifestyle' : 'studio',
    }));
  };

  const handleOpenProduct = (id: string) => {
    const found = products.find(
      (p) => p.id === id || p.sku.toLowerCase().includes(id.replace('prod-', ''))
    );
    if (found) {
      onOpenQuickView(found);
    }
  };

  return (
    <section className="bg-[#FAF9F6] border-b border-[#E7E5E4] pt-8 pb-14 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Minimalist Editorial Headline */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1 bg-white border border-[#E7E5E4] rounded-full text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#78716C] mb-2.5 sm:mb-3 shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#B48C36]" />
            <span>Colección de Autor en Plata 950 & 925</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#1C1917] font-normal tracking-tight leading-tight">
            Elegancia que se Siente y se Luce
          </h1>

          <p className="text-[11px] sm:text-sm text-[#78716C] mt-2 sm:mt-2.5 font-light max-w-xl mx-auto leading-relaxed">
            Descubre cómo lucen nuestras piezas principales en plata legítima peruana. Diseñadas para acompañarte todos los días con brillo inalterable.
          </p>
        </div>

        {/* 4-Panel Combined Model Banner — 2 columnas en móvil, 4 en desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {FEATURED_BANNER_MODELS.map((item, index) => {
            const currentMode = viewModes[item.id] || 'lifestyle';
            const displayImage =
              currentMode === 'lifestyle' ? item.lifestyleImage : item.studioImage;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleOpenProduct(item.id)}
                className="group relative bg-white rounded-xs border border-[#E7E5E4] hover:border-[#1C1917] transition-all duration-300 shadow-2xs hover:shadow-lg overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Visual Frame */}
                <div className="relative aspect-[3/4] bg-[#F5F5F4] overflow-hidden">
                  <img
                    src={displayImage}
                    alt={`${item.name} - ${currentMode === 'lifestyle' ? 'En modelo' : 'Foto de estudio'}`}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="eager"
                  />

                  {/* Badge */}
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 flex flex-col gap-0.5 sm:gap-1 items-start">
                    <span className="text-[7px] sm:text-[8.5px] font-bold tracking-wider sm:tracking-widest uppercase bg-white/95 text-[#1C1917] px-1.5 py-0.5 border border-[#E7E5E4] shadow-2xs">
                      {item.badge}
                    </span>
                    <span className="text-[6.5px] sm:text-[8px] font-medium tracking-wider uppercase bg-[#1C1917] text-white px-1.5 py-0.5">
                      {item.category}
                    </span>
                  </div>

                  {/* Toggle Between Model & Studio Photo */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
                    <button
                      type="button"
                      onClick={(e) => toggleViewMode(item.id, e)}
                      title={`Cambiar a vista ${currentMode === 'lifestyle' ? 'de estudio' : 'en modelo'}`}
                      className="bg-white/95 hover:bg-[#1C1917] text-[#1C1917] hover:text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[7px] sm:text-[8.5px] font-semibold tracking-wider uppercase rounded-xs border border-[#E7E5E4] shadow-2xs transition-colors"
                    >
                      {currentMode === 'lifestyle' ? 'Estudio' : 'En Modelo'}
                    </button>
                  </div>

                  {/* Quick Action Overlay Strip */}
                  <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[8px] sm:text-[10px] font-medium tracking-widest uppercase flex items-center gap-1">
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Ver
                    </span>
                    <span className="font-serif text-xs sm:text-sm font-semibold">
                      S/ {item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Clean Card Caption */}
                <div className="p-2 sm:p-3.5 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-2">
                      <h3 className="font-serif text-xs sm:text-base md:text-lg text-[#1C1917] font-normal group-hover:text-[#B48C36] transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="font-serif text-xs sm:text-sm md:text-base font-bold text-[#1C1917] whitespace-nowrap">
                        S/ {item.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[9px] sm:text-[11px] text-[#78716C] font-light mt-0.5 sm:mt-1 line-clamp-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 sm:pt-2.5 mt-2 sm:mt-2.5 border-t border-[#F5F5F4] flex items-center justify-between">
                    <span className="text-[8px] sm:text-[10px] font-medium tracking-wider uppercase text-[#A8A29E] truncate max-w-[65px] sm:max-w-none">
                      {item.material}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProduct(item.id);
                      }}
                      className="text-[8px] sm:text-[10px] font-semibold tracking-widest uppercase text-[#1C1917] hover:text-[#B48C36] flex items-center gap-0.5 sm:gap-1 transition-colors shrink-0"
                    >
                      <span>Ver Joya</span>
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Category Jump Strip */}
        <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-[#E7E5E4] flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 md:gap-4 text-xs text-[#78716C]">
          <span className="text-[8.5px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A8A29E] w-full sm:w-auto text-center">
            Explorar por Tipo:
          </span>
          {['Aretes', 'Conjuntos', 'Collares', 'Pulseras'].map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-white hover:bg-[#1C1917] text-[#1C1917] hover:text-white border border-[#E7E5E4] rounded-xs text-[9px] sm:text-[11px] font-medium tracking-wider uppercase transition-all shadow-2xs"
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => onSelectCategory('all')}
            className="text-[9px] sm:text-[11px] font-semibold tracking-wider uppercase text-[#1C1917] underline underline-offset-4 hover:text-[#B48C36] ml-1 sm:ml-2"
          >
            Ver toda la colección →
          </button>
        </div>

      </div>
    </section>
  );
};
