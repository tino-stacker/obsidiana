export interface ClienteDB {
  id?: string;
  nombre: string;
  doc_numero?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  referencia?: string;
  provincia?: string;
  distrito?: string;
  coords_lat?: number | null;
  coords_lng?: number | null;
  created_at?: string;
}

const STORAGE_KEY = 'obs_clients';

const getStoredClients = (): ClienteDB[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredClients = (clients: ClienteDB[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
};

export const clientesService = {
  async buscarOCrear(datos: ClienteDB): Promise<string | null> {
    const clients = getStoredClients();
    
    // Buscar por documento o por teléfono si existe
    const existingIndex = clients.findIndex(
      (c) =>
        (datos.doc_numero && c.doc_numero === datos.doc_numero) ||
        (datos.telefono && c.telefono === datos.telefono)
    );

    if (existingIndex >= 0) {
      // Actualizar cliente existente
      clients[existingIndex] = {
        ...clients[existingIndex],
        ...datos,
      };
      saveStoredClients(clients);
      return clients[existingIndex].id || `cli-${existingIndex}`;
    }

    // Crear nuevo cliente
    const newId = `cli-${Date.now()}`;
    const newClient: ClienteDB = {
      ...datos,
      id: newId,
      created_at: new Date().toISOString(),
    };
    clients.push(newClient);
    saveStoredClients(clients);
    return newId;
  },

  async getAll(): Promise<ClienteDB[]> {
    return getStoredClients();
  },
};
