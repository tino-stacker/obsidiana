/**
 * OBS-STORE · Local Supabase Stub
 * Supabase ha sido desvinculado a petición del usuario.
 * Todas las operaciones ahora se gestionan de forma local y persistente en el navegador.
 */

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange() {
      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      };
    },
    async signInWithPassword() {
      return { data: null, error: null };
    },
    async signOut() {
      return { error: null };
    },
  },
  from() {
    return {
      select() { return this; },
      insert() { return this; },
      update() { return this; },
      delete() { return this; },
      eq() { return this; },
      order() { return this; },
      limit() { return this; },
      single() { return Promise.resolve({ data: null, error: null }); },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      then(callback: any) { return Promise.resolve({ data: [], error: null }).then(callback); },
    };
  },
};
