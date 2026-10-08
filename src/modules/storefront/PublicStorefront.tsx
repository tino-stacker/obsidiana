import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { StorefrontNavbar } from './components/StorefrontNavbar';
import { StorefrontHeroBanner } from './components/StorefrontHeroBanner';
import { StorefrontTrustBar } from './components/StorefrontTrustBar';
import { StorefrontProductCard } from './components/StorefrontProductCard';
import { StorefrontQuickViewModal } from './components/StorefrontQuickViewModal';
import { StorefrontCartDrawer, CartItem } from './components/StorefrontCartDrawer';
import { StorefrontLookbook } from './components/StorefrontLookbook';
import { StorefrontFooter } from './components/StorefrontFooter';
import { Filter, ArrowUpDown, Sparkles, Check, ShoppingBag, X } from 'lucide-react';

interface PublicStorefrontProps {
  products: Product[];
}

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({ products }) => {
  // Navigation & Filtering States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Cart States
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('obsidiana_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Quick View Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState<boolean>(false);

  // Quick feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('obsidiana_cart', JSON.stringify(newCart));
    } catch (e) {
      console.warn('LocalStorage is full or unavailable');
    }
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const existing = cart.find((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updated = [...cart, { product, quantity }];
    }
    saveCart(updated);

    // Show temporary toast
    setToastMessage(`"${product.name}" agregada a tu bolsa`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    saveCart(updated);
  };

  const handleRemoveItem = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    saveCart(updated);
  };

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Categories derivation
  const categories = useMemo(() => {
    const preferredOrder = ['Aretes', 'Conjuntos', 'Collares', 'Pulseras', 'Anillos'];
    const existingCategories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
    const sorted = preferredOrder.filter((c) => existingCategories.includes(c));
    const leftovers = existingCategories.filter((c) => !preferredOrder.includes(c));
    return ['all', ...sorted, ...leftovers];
  }, [products]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const scrollToLookbook = () => {
    const el = document.getElementById('lookbook');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1C1917] font-sans selection:bg-[#E7E5E4] selection:text-[#1C1917] flex flex-col">
      {/* 1. Header & Navigation */}
      <StorefrontNavbar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCatalog();
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onScrollToLookbook={scrollToLookbook}
      />

      {/* 2. Hero Banner: Luminous 4-Panel Model Showcase */}
      <StorefrontHeroBanner
        products={products}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCatalog();
        }}
        onOpenQuickView={handleOpenQuickView}
      />

      {/* 3. Guarantees & Trust Pillars */}
      <StorefrontTrustBar />

      {/* 4. Main Products Catalog */}
      <main id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        {/* Catalog Control Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E7E5E4] mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-[#78716C] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#B48C36]" />
              <span>Platería de Autor</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1C1917] font-normal leading-tight">
              {selectedCategory === 'all' ? 'Colección Exclusiva' : selectedCategory}
            </h2>
            <p className="text-xs text-[#78716C] mt-1 font-light">
              Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'pieza' : 'piezas'} de plata peruana certificada
            </p>
          </div>

          {/* Quick Filters / Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Pills (Secondary row) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10.5px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#1C1917] text-white'
                      : 'bg-[#F5F5F4] text-[#44403C] hover:bg-[#E7E5E4]'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white hover:bg-[#F5F5F4] border border-[#E7E5E4] text-[#1C1917] text-xs font-medium py-1.5 pl-3 pr-8 rounded-xs cursor-pointer focus:outline-none transition-colors"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-[#78716C] absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#FAF9F6] rounded-xs border border-dashed border-[#E7E5E4] p-8">
            <Filter className="w-10 h-10 text-[#A8A29E] mx-auto mb-4 stroke-1" />
            <h3 className="font-serif text-2xl text-[#1C1917]">No encontramos coincidencias</h3>
            <p className="text-xs text-[#78716C] mt-2 max-w-md mx-auto">
              Intenta con otra palabra clave o restablece los filtros para ver la colección completa de Obsidiana.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-6 px-6 py-2.5 bg-[#1C1917] text-white text-[10px] font-bold tracking-[0.2em] uppercase rounded-xs hover:bg-[#44403C] transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onOpenQuickView={handleOpenQuickView}
              />
            ))}
          </div>
        )}
      </main>

      {/* 5. Editorial Lookbook Section */}
      <StorefrontLookbook
        products={products}
        onOpenQuickView={handleOpenQuickView}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCatalog();
        }}
      />

      {/* 6. Footer */}
      <StorefrontFooter
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCatalog();
        }}
        categories={categories}
      />

      {/* 7. Quick View Modal */}
      <StorefrontQuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
        onAddToCart={handleAddToCart}
      />

      {/* 8. Cart Drawer */}
      <StorefrontCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* 9. Floating Added-to-Cart Toast */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[130] bg-[#181716] text-[#FDFCFB] px-5 py-3.5 rounded-xs shadow-2xl border border-white/10 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-xs">
            <p className="font-medium text-[#FDFCFB]">{toastMessage}</p>
          </div>
          <button
            onClick={() => {
              setToastMessage(null);
              setIsCartOpen(true);
            }}
            className="ml-2 text-[10px] font-bold tracking-widest uppercase text-[#C29B38] hover:text-white underline underline-offset-4"
          >
            Ver Bolsa
          </button>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#8C8276] hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}
    </div>
  );
};
