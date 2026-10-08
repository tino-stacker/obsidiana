import React from 'react';

// Custom Vector SVG Brand Logo (Obsidiana Concentric Double Oval Rings)
export const ObsidianaLogoSvg: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="50" cy="50" rx="36" ry="46" stroke="currentColor" strokeWidth="5" />
    <ellipse cx="50" cy="50" rx="22" ry="38" stroke="currentColor" strokeWidth="3.5" />
  </svg>
);

// Custom Vector SVG Motorcycle Delivery Scooter Icon (Lima)
export const MotorbikeIconSvg: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="46" r="8" />
    <circle cx="48" cy="46" r="8" />
    <path d="M18 46h16l8-18h10" />
    <path d="M26 28h12v18" />
    <path d="M38 18l-6 10" />
    <path d="M46 16h6" />
    <path d="M12 36l6 10" />
    <path d="M42 28h10v8h-6" />
  </svg>
);

// Custom Vector SVG Package Box Icon (Provincia)
export const PackageBoxIconSvg: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M32 8L54 20V44L32 56L10 44V20L32 8Z" />
    <path d="M32 8V56" />
    <path d="M10 20L32 32L54 20" />
    <path d="M20 14.5L42 26.5" />
  </svg>
);
