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
    <section className="bg-white border-b border-[#E7E5E4] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-3 rounded-xs transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] flex items-center justify-center shrink-0 text-[#1C1917]">
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-wider uppercase text-[#1C1917]">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[#78716C] font-light leading-snug mt-0.5">
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
