import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Crown, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#181716] text-[#E4DFD7] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#A59B8F] selection:text-[#181716]">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#A59B8F]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[#242220] border border-[#61564A]/40 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full relative z-10 space-y-6">
        
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#181716] border border-[#A59B8F]/30 shadow-inner mb-1">
            <Lock className="w-7 h-7 text-[#A59B8F]" />
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1.5">
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#A59B8F]">OBSIDIANA JOYERÍA</span>
              <Sparkles className="w-3.5 h-3.5 text-[#A59B8F]" />
            </div>
            <h1 className="text-2xl font-serif tracking-wider font-semibold text-[#E4DFD7] mt-1">
              Control Administrativo
            </h1>
            <p className="text-xs text-[#A59B8F]/80 mt-1">
              Ingresa tus credenciales autorizadas
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={onLogin} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#A59B8F] uppercase tracking-wider block">
                Correo Electrónico
              </label>
              <span className="text-[10px] text-[#A59B8F]/60">Selecciona o escribe</span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A59B8F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                required
                placeholder="valentino@obsidiana.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-[#181716] border border-[#61564A]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-[#E4DFD7] placeholder-[#61564A] focus:outline-none focus:border-[#A59B8F] transition"
              />
            </div>

            {/* Botones para autorellenar ÚNICAMENTE el correo (la contraseña nunca se autorellena) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAuthEmail('valentino@obsidiana.com')}
                title="Autorellenar correo de Valentino"
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 cursor-pointer ${
                  authEmail === 'valentino@obsidiana.com'
                    ? 'bg-[#A59B8F]/20 border-[#A59B8F] text-[#E4DFD7] font-semibold'
                    : 'bg-[#181716] border-[#61564A]/40 text-[#A59B8F] hover:text-[#E4DFD7] hover:border-[#A59B8F]/80'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>valentino@obsidiana.com</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthEmail('ruben@obsidiana.com')}
                title="Autorellenar correo de Rubén"
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 cursor-pointer ${
                  authEmail === 'ruben@obsidiana.com'
                    ? 'bg-[#A59B8F]/20 border-[#A59B8F] text-[#E4DFD7] font-semibold'
                    : 'bg-[#181716] border-[#61564A]/40 text-[#A59B8F] hover:text-[#E4DFD7] hover:border-[#A59B8F]/80'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>ruben@obsidiana.com</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A59B8F] uppercase tracking-wider block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A59B8F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Ingresa tu contraseña"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-[#181716] border border-[#61564A]/50 rounded-xl pl-10 pr-10 py-3 text-sm text-[#E4DFD7] placeholder-[#61564A] focus:outline-none focus:border-[#A59B8F] transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A59B8F] hover:text-[#E4DFD7] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-linear-to-r from-[#A59B8F] to-[#E4DFD7] text-[#181716] font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition shadow-lg cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando Credenciales...</span>
              </>
            ) : (
              <span>Acceder al Panel de Control</span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-2 border-t border-[#61564A]/30 text-center">
          <button
            type="button"
            onClick={onGoToPublic}
            className="inline-flex items-center space-x-2 text-xs text-[#A59B8F] hover:text-[#E4DFD7] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la Tienda Pública</span>
          </button>
        </div>

      </div>
    </div>
  );
};
