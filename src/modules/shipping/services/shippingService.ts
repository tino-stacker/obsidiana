import { INITIAL_PROVINCES, INITIAL_ZONES, INITIAL_DISTRICTS } from '../../../data/mockData';
import { Province, Zone, District } from '../../../types';

const PROVINCES_KEY = 'obs_provinces';
const ZONES_KEY = 'obs_zones';
const DISTRICTS_KEY = 'obs_districts';

const getStoredData = <T>(key: string, initial: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initial;
  } catch {
    return initial;
  }
};

const saveStoredData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
};

export const shippingService = {
  // PROVINCIAS
  async getProvincias(): Promise<Province[]> {
    return getStoredData(PROVINCES_KEY, INITIAL_PROVINCES);
  },

  // ZONAS
  async getZonas(): Promise<Zone[]> {
    return getStoredData(ZONES_KEY, INITIAL_ZONES);
  },

  async crearZona(zonaData: Omit<Zone, 'id' | 'status'>): Promise<Zone> {
    const zones = getStoredData(ZONES_KEY, INITIAL_ZONES);
    const newZone: Zone = {
      ...zonaData,
      id: `zone-${Date.now()}`,
      status: 'active',
    };
    zones.push(newZone);
    saveStoredData(ZONES_KEY, zones);
    return newZone;
  },

  async actualizarZona(id: string, cambios: Partial<Zone>): Promise<void> {
    const zones = getStoredData(ZONES_KEY, INITIAL_ZONES);
    const updated = zones.map((z) => (z.id === id ? { ...z, ...cambios } : z));
    saveStoredData(ZONES_KEY, updated);
  },

  async eliminarZona(id: string): Promise<void> {
    const zones = getStoredData(ZONES_KEY, INITIAL_ZONES);
    const updated = zones.filter((z) => z.id !== id);
    saveStoredData(ZONES_KEY, updated);
  },

  // DISTRITOS
  async getDistritos(provinciaId?: string): Promise<District[]> {
    const dists = getStoredData(DISTRICTS_KEY, INITIAL_DISTRICTS);
    if (provinciaId) {
      return dists.filter((d) => d.provinceId === provinciaId);
    }
    return dists;
  },

  async crearDistrito(
    dataOrName: string | { name: string; provinceId: string; zoneId: string },
    provinciaId?: string,
    zonaId?: string
  ): Promise<District> {
    const dists = getStoredData(DISTRICTS_KEY, INITIAL_DISTRICTS);
    const name = typeof dataOrName === 'string' ? dataOrName : dataOrName.name;
    const pId = typeof dataOrName === 'string' ? (provinciaId || '') : dataOrName.provinceId;
    const zId = typeof dataOrName === 'string' ? (zonaId || '') : dataOrName.zoneId;

    const newDistrict: District = {
      id: `dist-${Date.now()}`,
      name,
      provinceId: pId,
      zoneId: zId,
    };
    dists.push(newDistrict);
    saveStoredData(DISTRICTS_KEY, dists);
    return newDistrict;
  },

  async eliminarDistrito(id: string): Promise<void> {
    const dists = getStoredData(DISTRICTS_KEY, INITIAL_DISTRICTS);
    const updated = dists.filter((d) => d.id !== id);
    saveStoredData(DISTRICTS_KEY, updated);
  },
};
