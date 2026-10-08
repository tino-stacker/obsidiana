import React, { useState } from 'react';
import { Search, ShoppingBag, Menu, X, Sparkles, Diamond, ArrowRight } from 'lucide-react';

interface StorefrontNavbarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onScrollToLookbook?: () => void;
}

export const StorefrontNavbar: React.FC<StorefrontNavbarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onScrollToLookbook,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleCategoryClick = (cat: string) => {
    onSelectCategory(cat);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Top Luxury Announcement Bar */}
      <div className="bg-[#292524] text-white/90 text-[10px] tracking-[0.22em] uppercase py-2 px-4 text-center font-medium border-b border-[#1C1917] flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-[#B48C36] shrink-0" />
        <span className="truncate">
          Plata Peruana Ley 950 & 925 Certificada • Envíos Express a Todo el Perú • Empaque de Regalo Incluido
        </span>
        <Sparkles className="w-3 h-3 text-[#B48C36] shrink-0 hidden sm:inline" />
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#181716] hover:text-[#8C8276] transition-colors"
              title="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-[#181716] hover:text-[#8C8276] transition-colors"
              title="Buscar joya"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Logo */}
          <div 
            onClick={() => onSelectCategory('all')} 
            className="flex items-center gap-3.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 bg-[#181716] rounded-xs flex items-center justify-center shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img
                src="/assets/Icono/icono-negro.jpeg"
                alt="Obsidiana Joyería"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="font-serif text-2xl tracking-[0.25em] font-normal uppercase text-[#181716] block leading-none">
                Obsidiana
              </span>
              <span className="text-[8.5px] tracking-[0.35em] text-[#8C8276] uppercase font-sans font-medium block mt-1">
                Joyería Fina & Plata 950
              </span>
            </div>
          </div>

          {/* Desktop Categories Links */}
          <div className="hidden lg:flex items-center gap-8">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-200 py-1 relative ${
                    isActive
                      ? 'text-[#181716] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#181716]'
                      : 'text-[#8C8276] hover:text-[#181716]'
                  }`}
                >
                  {cat === 'all' ? 'Toda la Colección' : cat}
                </button>
              );
            })}

            {onScrollToLookbook && (
              <button
                onClick={onScrollToLookbook}
                className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8C8276] hover:text-[#181716] transition-colors"
              >
                Inspiración
              </button>
            )}
          </div>

          {/* Right Actions: Search + Bag */}
          <div className="flex items-center gap-4">
            {/* Desktop Search Field */}
            <div className="hidden md:flex items-center relative w-60">
              <input
                type="text"
                placeholder="Buscar joya o SKU..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F7F5F2] border border-[#E4DFD7] rounded-xs text-xs text-[#181716] placeholder-[#A59B8F] focus:outline-none focus:border-[#181716] focus:bg-white transition-all"
              />
              <Search className="w-3.5 h-3.5 text-[#8C8276] absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A59B8F] hover:text-[#181716]"
                >
                  ×
                </button>
              )}
            </div>

            {/* Shopping Bag Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2.5 bg-[#181716] hover:bg-[#61564A] text-[#FDFCFB] px-4 py-2.5 rounded-xs transition-all duration-300 shadow-sm active:scale-95 group"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-[#C29B38] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase hidden sm:inline">
                Bolsa
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && (
          <div className="lg:hidden px-4 py-3 bg-[#F7F5F2] border-t border-[#EBE6DF]">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar por nombre o modelo..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#E4DFD7] rounded-xs text-sm text-[#181716] placeholder-[#A59B8F] focus:outline-none focus:border-[#181716]"
                autoFocus
              />
              <Search className="w-4 h-4 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#A59B8F]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Flyout Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#FDFCFB] border-t border-[#EBE6DF] px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C8276] mb-3">
                Categorías
              </p>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`w-full flex items-center justify-between text-left py-2.5 text-xs font-semibold tracking-[0.15em] uppercase border-b border-[#F7F5F2] ${
                    selectedCategory === cat ? 'text-[#181716] font-bold' : 'text-[#61564A]'
                  }`}
                >
                  <span>{cat === 'all' ? 'Toda la Colección' : cat}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A59B8F]" />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-[#EBE6DF]">
              <a
                href="#rubenasmat"
                className="text-[10px] font-semibold text-[#8C8276] hover:text-[#181716] uppercase tracking-[0.15em] block py-1"
              >
                Acceso Administrativo
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
