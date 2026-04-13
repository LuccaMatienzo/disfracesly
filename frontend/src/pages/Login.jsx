import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.correo, form.contrasena);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Panel izquierdo (branding) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-1 gradient-primary flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl font-display font-bold mx-auto mb-6">
            D
          </div>
          <h1 className="font-display text-display-md font-bold mb-4">Disfracesly</h1>
          <p className="text-body-lg opacity-80">
            Sistema de gestión de alquileres y ventas de disfraces
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 opacity-60">
            {['Alquileres', 'Ventas', 'Stock', 'Clientes', 'Catálogo', 'Reportes'].map((t) => (
              <div key={t} className="bg-white/10 rounded-xl py-3 text-sm font-label text-center">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho (form) ────────────────────────────────────── */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">D</div>
            <span className="font-display font-bold text-headline-md text-on-surface">Disfracesly</span>
          </div>

          <h2 className="font-display text-headline-md font-bold text-on-surface mb-1">Bienvenido</h2>
          <p className="text-body-md text-on-surface-variant mb-8">Ingresá con tu cuenta de administrador</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="correo"
              label="Correo electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.correo}
              onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
              required
            />
            <Input
              id="contrasena"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={form.contrasena}
              onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
              required
            />

            {error && (
              <div className="bg-error/10 text-error text-body-md rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              Iniciar sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
