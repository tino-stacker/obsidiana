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
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E7E5E4] rounded-full text-[10px] font-semibold tracking-[0.25em] uppercase text-[#78716C] mb-3 shadow-xs">
            <Sparkles className="w-3 h-3 text-[#B48C36]" />
            <span>Colección de Autor en Plata 950 & 925</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1C1917] font-normal tracking-tight leading-tight">
            Elegancia que se Siente y se Luce
          </h1>

          <p className="text-xs sm:text-sm text-[#78716C] mt-2.5 font-light max-w-xl mx-auto leading-relaxed">
            Descubre cómo lucen nuestras piezas principales en plata legítima peruana. Diseñadas para acompañarte todos los días con brillo inalterable.
          </p>
        </div>

        {/* 4-Panel Combined Model Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
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
                className="group relative bg-white rounded-xs border border-[#E7E5E4] hover:border-[#1C1917] transition-all duration-300 shadow-xs hover:shadow-lg overflow-hidden flex flex-col cursor-pointer"
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
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                    <span className="text-[9px] font-bold tracking-widest uppercase bg-white/95 text-[#1C1917] px-2.5 py-1 border border-[#E7E5E4] shadow-xs">
                      {item.badge}
                    </span>
                    <span className="text-[8.5px] font-medium tracking-wider uppercase bg-[#1C1917] text-white px-2 py-0.5">
                      {item.category}
                    </span>
                  </div>

                  {/* Toggle Between Model & Studio Photo */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={(e) => toggleViewMode(item.id, e)}
                      title={`Cambiar a vista ${currentMode === 'lifestyle' ? 'de estudio' : 'en modelo'}`}
                      className="bg-white/90 hover:bg-[#1C1917] text-[#1C1917] hover:text-white px-2.5 py-1 text-[9px] font-semibold tracking-wider uppercase rounded-xs border border-[#E7E5E4] shadow-xs transition-colors"
                    >
                      {currentMode === 'lifestyle' ? 'Ver Estudio' : 'Ver en Modelo'}
                    </button>
                  </div>

                  {/* Quick Action Overlay Strip */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] font-medium tracking-widest uppercase flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Ver Detalles
                    </span>
                    <span className="font-serif text-sm font-semibold">
                      S/ {item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Clean Card Caption */}
                <div className="p-4 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-lg text-[#1C1917] font-normal group-hover:text-[#B48C36] transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="font-serif text-base font-bold text-[#1C1917]">
                        S/ {item.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#78716C] font-light mt-1 line-clamp-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#F5F5F4] flex items-center justify-between">
                    <span className="text-[10px] font-medium tracking-wider uppercase text-[#A8A29E]">
                      {item.material}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProduct(item.id);
                      }}
                      className="text-[10.5px] font-semibold tracking-widest uppercase text-[#1C1917] hover:text-[#B48C36] flex items-center gap-1 transition-colors"
                    >
                      <span>Ver Joya</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Category Jump Strip */}
        <div className="mt-8 pt-6 border-t border-[#E7E5E4] flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[#78716C]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A8A29E]">
            Explorar por Tipo:
          </span>
          {['Aretes', 'Conjuntos', 'Collares', 'Pulseras'].map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="px-3.5 py-1.5 bg-white hover:bg-[#1C1917] text-[#1C1917] hover:text-white border border-[#E7E5E4] rounded-xs text-[11px] font-medium tracking-wider uppercase transition-all shadow-xs"
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => onSelectCategory('all')}
            className="text-[11px] font-semibold tracking-wider uppercase text-[#1C1917] underline underline-offset-4 hover:text-[#B48C36] ml-2"
          >
            Ver toda la colección →
          </button>
        </div>

      </div>
    </section>
  );
};
