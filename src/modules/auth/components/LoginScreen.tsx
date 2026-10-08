import React from 'react';

interface LoginScreenProps {
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authError: string;
  authLoading: boolean;
  onLogin: (e: React.FormEvent) => Promise<void> | void;
  onGoToPublic: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  authLoading,
  onLogin,
  onGoToPublic,
}) => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-[#E7E5E4] text-center space-y-6">
        <div className="w-full flex justify-center mb-2">
          <img
            src="/LOGO PRINCIPAL/LOGO PRINCIPAL.png"
            alt="Logo Obsidiana"
            className="w-48 sm:w-56 h-auto object-contain"
          />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-widest text-[#1C1917] uppercase">ACCESO ADMIN</h2>
          <p className="text-xs text-[#78716C] mt-1.5 font-light">Ingresa con tus credenciales de administrador.</p>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <input
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              placeholder="Usuario"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E7E5E4] rounded-lg px-4 py-3 text-center tracking-wider text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] focus:bg-white transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E7E5E4] rounded-lg px-4 py-3 text-center tracking-wider text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] focus:bg-white transition-colors"
            />
          </div>
          {authError && (
            <p className="text-rose-600 text-xs font-medium py-1 px-2 bg-rose-50 rounded-xs border border-rose-200">
              {authError}
            </p>
          )}
          <button
            disabled={authLoading}
            type="submit"
            className="w-full bg-[#1C1917] text-white font-bold py-3.5 rounded-lg uppercase tracking-widest text-xs hover:bg-[#44403C] transition-colors disabled:opacity-50 shadow-sm"
          >
            {authLoading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div className="pt-2 border-t border-[#F5F5F4]">
          <button
            onClick={onGoToPublic}
            className="text-xs text-[#78716C] hover:text-[#1C1917] underline transition-colors"
          >
            ← Volver a la Tienda Pública
          </button>
        </div>
      </div>
    </div>
  );
};
