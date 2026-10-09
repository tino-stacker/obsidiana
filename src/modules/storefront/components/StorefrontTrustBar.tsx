import React from 'react';
import { ShieldCheck, Truck, Gift, MessageCircle } from 'lucide-react';

export const StorefrontTrustBar: React.FC = () => {
  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Plata Fina Ley 950 / 925',
      subtitle: 'Pureza garantizada con certificación artesanal peruana',
    },
    {
      icon: Truck,
      title: 'Envíos a Todo el Perú',
      subtitle: 'Lima Express 24h y Provincias vía Shalom y Olva Courier',
    },
    {
      icon: Gift,
      title: 'Empaque de Regalo Signature',
      subtitle: 'Incluye estuche de lujo y paño abrillantador de cortesía',
    },
    {
      icon: MessageCircle,
      title: 'Atención Personalizada',
      subtitle: 'Asesoría en vivo por WhatsApp para ayudarte a elegir',
    },
  ];

  return (
    <section className="bg-white border-b border-[#E7E5E4] py-6 sm:py-8 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 sm:gap-3.5 p-2 sm:p-3 rounded-xs transition-colors bg-[#FAF9F6]/60 sm:bg-transparent border border-[#F5F5F4] sm:border-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] flex items-center justify-center shrink-0 text-[#1C1917]">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-[#1C1917] truncate">
                    {item.title}
                  </h3>
                  <p className="text-[9px] sm:text-[11px] text-[#78716C] font-light leading-snug mt-0.5 line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
