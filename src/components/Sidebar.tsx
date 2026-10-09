import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Package, 
  MapPin, 
  Search, 
  BarChart3, 
  Mail, 
  RotateCcw,
  Menu,
  X,
  Store,
  Users,
  LogOut,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Crown
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'orders' | 'pos' | 'inventory' | 'shipping' | 'tracking' | 'reports' | 'emails' | 'clients';
  setActiveTab: (tab: 'orders' | 'pos' | 'inventory' | 'shipping' | 'tracking' | 'reports' | 'emails' | 'clients') => void;
  onResetData: () => void;
  pendingOrdersCount: number;
  lowStockCount: number;
  onLogout?: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    role?: string;
    roleName?: string;
  } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  pendingOrdersCount,
  lowStockCount,
  onLogout,
  currentUser,
}) => {
  // Obtener usuario dinámicamente de props o localStorage
  const activeUser = currentUser || (() => {
    try {
      const savedUser = localStorage.getItem('obsidiana_admin_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return {
          name: parsed.fullName || parsed.name,
          email: parsed.email,
          role: parsed.roleCode || parsed.role,
          roleName: parsed.roleName,
        };
      }
      const savedSession = localStorage.getItem('obs_admin_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        return {
          name: parsed.user?.user_metadata?.name || parsed.user?.email,
          email: parsed.user?.email,
          role: parsed.role || parsed.user?.user_metadata?.role,
          roleName: parsed.roleName || parsed.user?.user_metadata?.roleName,
        };
      }
    } catch {}
    return null;
  })();

  const isOwner = activeUser?.role === 'OWNER' || activeUser?.email === 'valentino@obsidiana.com';
  const displayName = activeUser?.name || (isOwner ? 'Valentino' : 'Rubén Asmat');
  const displayRole = activeUser?.roleName || (isOwner ? 'Propietario' : 'Administrador');
  const roleCode = activeUser?.role || (isOwner ? 'OWNER' : 'ADMIN');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = [
    {
      title: 'VENTAS & CLIENTES',
      items: [
        {
          id: 'pos' as const,
          label: 'Punto de Venta / POS',
          icon: Store,
          badge: 'NUEVO',
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
        {
          id: 'orders' as const,
          label: 'Gestión de Pedidos',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : null,
          badgeColor: 'bg-amber-400 text-stone-950 font-bold',
        },
        {
          id: 'clients' as const,
          label: 'Directorio Clientes',
          icon: Users,
        },
      ]
    },
    {
      title: 'CATÁLOGO & STOCK',
      items: [
        {
          id: 'inventory' as const,
          label: 'Inventario de Joyas',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} bajo` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        },
      ]
    },
    {
      title: 'LOGÍSTICA & DESPACHO',
      items: [
        {
          id: 'shipping' as const,
          label: 'Tarifas & Zonas Envío',
          icon: MapPin,
        },
        {
          id: 'tracking' as const,
          label: 'Rastreo en Vivo',
          icon: Search,
        },
      ]
    },
    {
      title: 'ANÁLISIS & COMUNICACIÓN',
      items: [
        {
          id: 'reports' as const,
          label: 'Reportes & Finanzas',
          icon: BarChart3,
        },
        {
          id: 'emails' as const,
          label: 'Notificaciones & WhatsApp',
          icon: Mail,
        },
      ]
    }
  ];

  const handleNavClick = (id: 'orders' | 'pos' | 'inventory' | 'shipping' | 'tracking' | 'reports' | 'emails' | 'clients') => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-stone-950 border-b border-stone-800/80 px-4 py-3 flex items-center justify-between text-stone-100 sticky top-0 z-30">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('orders')}>
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/40 bg-stone-900 flex items-center justify-center">
            <img src="/LOGO PRINCIPAL/LOGO PRINCIPAL.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-widest text-stone-100 uppercase">
              OBSIDIANA
            </span>
            <span className="text-[10px] text-amber-400 block font-mono">PANEL ADMIN</span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-900 rounded-lg transition-colors border border-stone-800"
          aria-label="Menú"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Side Navigation Bar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40
          w-64 md:w-72 h-screen
          bg-stone-950 border-r border-stone-800/80
          text-stone-200 flex flex-col justify-between
          transition-transform duration-300 ease-in-out shrink-0
          shadow-2xl md:shadow-none
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-800/80 bg-linear-to-b from-stone-900/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => handleNavClick('orders')}>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/30 bg-stone-900 flex items-center justify-center p-1 shadow-md group-hover:border-amber-400 transition-colors">
                <img src="/LOGO PRINCIPAL/LOGO PRINCIPAL.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-black text-sm tracking-widest text-stone-100 uppercase">
                    OBSIDIANA
                  </h1>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-[10px] text-stone-400 tracking-wider font-light">
                  JOYERÍA & PLATA FINA
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-stone-400 hover:text-stone-100 p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Badge Dinámico por Usuario */}
          <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/90 border border-stone-800 shadow-inner">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-stone-100 truncate">
                  {displayName}
                </p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className={`text-[10px] font-semibold ${isOwner ? 'text-amber-400' : 'text-sky-400'}`}>
                    {displayRole}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    isOwner ? 'bg-amber-400/20 text-amber-300 border border-amber-500/30' : 'bg-sky-400/20 text-sky-300 border border-sky-500/30'
                  }`}>
                    {roleCode}
                  </span>
                </div>
              </div>
            </div>
            {isOwner ? (
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {section.title}
              </p>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium
                      transition-all duration-200 group cursor-pointer text-left
                      ${
                        isActive
                          ? 'bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-400/10'
                          : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/90'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-stone-950' : 'text-stone-400 group-hover:text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] rounded-md ${item.badgeColor || 'bg-stone-800 text-stone-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-stone-800/80 bg-stone-950 space-y-2">
          {/* Link to Public Store */}
          <a
            href="/#catalogo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between text-xs font-semibold text-stone-200 bg-stone-900 hover:bg-stone-800 hover:text-white py-2.5 px-3 rounded-xl border border-stone-800 transition-all group"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Tienda Pública</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onResetData}
              title="Restablecer datos demo"
              className="flex items-center justify-center space-x-1.5 text-[11px] font-medium text-stone-400 hover:text-stone-200 bg-stone-900/60 hover:bg-stone-900 border border-stone-800/80 py-2 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar</span>
            </button>

            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  localStorage.removeItem('obs_admin_session');
                  window.location.reload();
                }
              }}
              title="Cerrar Sesión"
              className="flex items-center justify-center space-x-1.5 text-[11px] font-medium text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 py-2 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Salir</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-stone-400 pt-1">
            Obsidiana Perú • v2.0
          </p>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-xs"
        />
      )}
    </>
  );
};

