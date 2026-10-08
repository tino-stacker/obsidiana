import { INITIAL_PRODUCTS } from '../../../data/mockData';

export interface ProductoDB {
  id: string;
  nombre: string;
  categoria: string;
  material: string;
  precio: number;
  stock: number;
  stock_minimo?: number;
  sku?: string;
  ubicacion?: string;
  descripcion?: string;
  imagen_url?: string;
  hover_imagen_url?: string;
  peso_gramos?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'obs_products';

const getInitialProductsDB = (): ProductoDB[] => {
  return INITIAL_PRODUCTS.map((p) => ({
    id: p.id,
    nombre: p.name,
    categoria: p.category,
    material: (p as any).material || 'Plata Ley 950',
    precio: p.price,
    stock: p.stock,
    stock_minimo: p.minStock,
    sku: p.sku,
    ubicacion: p.location,
    descripcion: '',
    imagen_url: p.imageUrl,
    hover_imagen_url: p.hoverImageUrl,
    peso_gramos: 0,
    activo: true,
    created_at: p.updatedAt,
    updated_at: p.updatedAt,
  }));
};

const getStoredProducts = (): ProductoDB[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialProductsDB();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getInitialProductsDB();
  } catch {
    return getInitialProductsDB();
  }
};

const saveStoredProducts = (products: ProductoDB[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
};

export const productosService = {
  async getAll(): Promise<ProductoDB[]> {
    const products = getStoredProducts();
    return products.filter((p) => p.activo !== false);
  },

  async updateStock(id: string, nuevoStock: number): Promise<void> {
    const products = getStoredProducts();
    const updated = products.map((p) =>
      p.id === id ? { ...p, stock: nuevoStock, updated_at: new Date().toISOString() } : p
    );
    saveStoredProducts(updated);
  },

  async create(producto: Omit<ProductoDB, 'id' | 'created_at' | 'updated_at'>): Promise<ProductoDB> {
    const products = getStoredProducts();
    const now = new Date().toISOString();
    const newProduct: ProductoDB = {
      ...producto,
      id: `prod-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    products.unshift(newProduct);
    saveStoredProducts(products);
    return newProduct;
  },

  async update(id: string, changes: Partial<ProductoDB>): Promise<void> {
    const products = getStoredProducts();
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...changes, updated_at: new Date().toISOString() } : p
    );
    saveStoredProducts(updated);
  },
};
