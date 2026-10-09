import React from 'react';
import { Eye, ArrowRight, Diamond } from 'lucide-react';
import { Product } from '../../../types';

interface StorefrontLookbookProps {
  products: Product[];
  onOpenQuickView: (product: Product) => void;
  onSelectCategory: (category: string) => void;
}

interface LookbookItem {
  id: string;
  title: string;
  category: string;
  lifestyleImage: string;
  studioImage: string;
  price: string;
  tagline: string;
}

const LOOKBOOK_ITEMS: LookbookItem[] = [
  {
    id: 'prod-col-022',
    title: 'Nudo de Bruja',
    category: 'Collares',
    lifestyleImage: '/productos/prod-col-022-hover.jpeg',
    studioImage: '/productos/prod-col-022.jpeg',
    price: 'S/ 89.00',
    tagline: 'Amuleto en Plata Ley 950 maciza con cadena regulable.',
  },
  {
    id: 'prod-con-019',
    title: 'Conjunto Perla Circón',
    category: 'Conjuntos',
    lifestyleImage: '/productos/prod-con-019-hover.jpeg',
    studioImage: '/productos/prod-con-019.jpeg',
    price: 'S/ 89.00',
    tagline: 'Perla de brillo natural engarzada con circones suizos.',
  },
  {
    id: 'prod-are-001',
    title: 'Aretes Conchita',
    category: 'Aretes',
    lifestyleImage: '/productos/prod-are-001-hover.jpeg',
    studioImage: '/productos/prod-are-001.jpeg',
    price: 'S/ 59.00',
    tagline: 'Diseño marino con poste hipoalergénico en plata fina.',
  },
  {
    id: 'prod-pul-039',
    title: 'Pulsera Tres Lazos',
    category: 'Pulseras',
    lifestyleImage: '/productos/prod-pul-039-hover.jpeg',
    studioImage: '/productos/prod-pul-039.jpeg',
    price: 'S/ 149.00',
    tagline: 'Tres lazos entrelazados forjados con peso macizo artesanal.',
  },
];

export const StorefrontLookbook: React.FC<StorefrontLookbookProps> = ({
  products,
  onOpenQuickView,
  onSelectCategory,
}) => {
  const handleOpenProduct = (id: string) => {
    const found = products.find(
      (p) => p.id === id || p.sku.toLowerCase().includes(id.replace('prod-', ''))
    );
    if (found) {
      onOpenQuickView(found);
    }
  };

  return (
    <section id="lookbook" className="py-16 bg-[#FAF9F6] border-t border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-[#78716C] mb-2">
            <Diamond className="w-3 h-3 text-[#B48C36]" />
            <span>Galería en Modelo</span>
            <Diamond className="w-3 h-3 text-[#B48C36]" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1C1917] font-normal leading-tight">
            Cada Joya en su Máxima Expresión
          </h2>
          <p className="text-xs sm:text-sm text-[#78716C] font-light mt-2 max-w-md mx-auto">
            Aprecia las proporciones, el brillo de la plata y el ajuste real de nuestras piezas más solicitadas.
          </p>
        </div>

        {/* 4 Clean Columns of Real Models — 2 columnas en móvil, 4 en desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {LOOKBOOK_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenProduct(item.id)}
              className="group bg-white rounded-xs border border-[#E7E5E4] hover:border-[#1C1917] transition-all duration-300 shadow-2xs hover:shadow-md overflow-hidden flex flex-col cursor-pointer"
            >
              {/* Large Sharp Model Photo */}
              <div className="relative aspect-[4/5] bg-[#F5F5F4] overflow-hidden">
                <img
                  src={item.lifestyleImage}
                  alt={`${item.title} en modelo`}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = item.studioImage;
                  }}
                />
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white/95 text-[#1C1917] text-[7px] sm:text-[8.5px] font-semibold tracking-wider uppercase px-1.5 py-0.5 sm:px-2 sm:py-0.5 border border-[#E7E5E4]">
                  {item.category}
                </div>
              </div>

              {/* Caption */}
              <div className="p-2 sm:p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-1">
                    <h3 className="font-serif text-xs sm:text-sm md:text-base text-[#1C1917] font-normal group-hover:text-[#B48C36] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <span className="font-serif text-xs sm:text-sm font-bold text-[#1C1917] whitespace-nowrap">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10.5px] text-[#78716C] font-light mt-0.5 sm:mt-1 leading-snug line-clamp-2">
                    {item.tagline}
                  </p>
                </div>

                <div className="pt-2 sm:pt-2.5 mt-2 sm:mt-2.5 border-t border-[#F5F5F4] flex items-center justify-between">
                  <span className="text-[8px] sm:text-[10px] text-[#A8A29E] uppercase tracking-wider truncate max-w-[65px] sm:max-w-none">
                    Plata Ley 950
                  </span>
                  <span className="text-[8px] sm:text-[10px] font-semibold text-[#1C1917] flex items-center gap-0.5 sm:gap-1 group-hover:text-[#B48C36] transition-colors shrink-0">
                    <span>Ver Detalles</span>
                    <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
