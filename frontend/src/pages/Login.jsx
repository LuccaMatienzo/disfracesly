import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Inicializar estado leyendo el correo guardado (si existe)
  const savedEmail = localStorage.getItem('rememberedEmail') || '';
  const [form, setForm] = useState({ 
    correo: savedEmail, 
    contrasena: '', 
    rememberMe: !!savedEmail 
  });
  const [touched, setTouched] = useState({ correo: false, contrasena: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo);
  const isPasswordValid = form.contrasena.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.correo, form.contrasena, form.rememberMe);
      
      // Guardar de forma no crítica el correo para pre-llenarlo la próxima vez
      if (form.rememberMe) {
        localStorage.setItem('rememberedEmail', form.correo);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Credenciales inválidas. Verificá tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center relative overflow-hidden p-4">

      {/* ── Blobs decorativos ─────────────────────────────────────────────── */}
      <div className="absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* ── Glass Panel ───────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-md bg-card-panel/85 backdrop-blur-xl rounded-3xl shadow-editorial border border-divider p-10 animate-slide-up">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo_svg_verdelima.svg"
              alt="Disfracesly"
              className="size-[6.5rem] sm:w-[7.5rem] sm:h-[7.5rem] object-contain drop-shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-primary text-4xl font-black">D</span>';
              }}
            />
          </div>
          <h1 className="font-headline font-semibold text-2xl text-on-surface tracking-tight">
            DisfracesLy
          </h1>
          <p className="text-tertiary text-sm mt-1 font-label uppercase tracking-widest">
            Acceso al Sistema
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

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
                onBlur={() => setTouched((p) => ({ ...p, correo: true }))}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-container-low border border-divider text-on-surface placeholder:text-tertiary placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
            {touched.correo && form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo) && (
              <p className="text-red-500 text-sm mt-1">Correo inválido</p>
            )}
            {touched.correo && !form.correo && (
              <p className="text-red-500 text-sm mt-1">El correo es obligatorio</p>
            )}
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
                onBlur={() => setTouched((p) => ({ ...p, contrasena: true }))}
                required
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-surface-container-low border border-divider text-on-surface placeholder:text-tertiary placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:ring-2 focus:ring-primary/40 transition [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-tertiary hover:text-primary transition-colors"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <span className="material-symbols-outlined text-xl leading-none">
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {touched.contrasena && form.contrasena.length > 0 && form.contrasena.length < 6 && (
              <p className="text-red-500 text-sm mt-1">La contraseña debe tener al menos 6 caracteres</p>
            )}
            {touched.contrasena && !form.contrasena && (
              <p className="text-red-500 text-sm mt-1">La contraseña es obligatoria</p>
            )}
          </div>

          {/* Remember workstation */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="size-4 rounded accent-primary"
              id="remember"
              checked={form.rememberMe}
              onChange={(e) => setForm(p => ({ ...p, rememberMe: e.target.checked }))}
            />
            <span className="text-sm text-on-surface-variant">
              Recordar este equipo
            </span>
          </label>

          {/* Error general */}
          {error && (
            <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-slide-up">
              <span className="material-symbols-outlined text-[20px] shrink-0 leading-none">error_outline</span>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl editorial-gradient text-white font-headline font-bold text-base shadow-lg transition-all flex items-center justify-center gap-3 mt-2 ${
              loading
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-[1.02] active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando…
              </>
            ) : (
              <>
                Iniciar sesión
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </>
            )}
          </button>
        </form>


      </div>


    </div>
  );
}
