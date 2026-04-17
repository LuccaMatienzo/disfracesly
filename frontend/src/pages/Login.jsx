import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.correo, form.contrasena);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Credenciales inválidas. Verificá tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaeb] flex items-center justify-center relative overflow-hidden p-4">

      {/* ── Blobs decorativos ─────────────────────────────────────────────── */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* ── Glass Panel ───────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-md bg-white/85 backdrop-blur-xl rounded-3xl shadow-editorial border border-white/60 p-10 animate-slide-up">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl editorial-gradient shadow-lg mb-4">
            <img
              src="/logo.png"
              alt="Disfracesly"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-white text-2xl font-black">D</span>';
              }}
            />
          </div>
          <h1 className="font-headline font-black text-2xl text-on-surface tracking-tight">
            Atelier Access
          </h1>
          <p className="text-tertiary text-sm mt-1 font-label uppercase tracking-widest">
            Internal Administrative Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Correo */}
          <div>
            <label htmlFor="correo" className="block text-xs font-label uppercase tracking-widest text-on-surface font-bold mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary text-xl pointer-events-none">
                mail
              </span>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                placeholder="empleado@disfracesly.ar"
                value={form.correo}
                onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="contrasena" className="block text-xs font-label uppercase tracking-widest text-on-surface font-bold mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary text-xl pointer-events-none">
                lock
              </span>
              <input
                id="contrasena"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••"
                value={form.contrasena}
                onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
                required
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember workstation */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-primary"
              id="remember"
            />
            <span className="text-sm text-on-surface-variant">
              Remember this workstation
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3 flex items-start gap-3 animate-slide-up">
              <span className="material-symbols-outlined text-xl mt-0.5 shrink-0">error_outline</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl editorial-gradient text-white font-headline font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Enter Atelier
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </>
            )}
          </button>
        </form>


      </div>


    </div>
  );
}
