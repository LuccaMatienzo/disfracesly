import { FiX, FiGlobe, FiBell } from 'react-icons/fi';

export default function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-card-panel border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <h2 className="text-xl font-headline font-bold text-on-surface">Configuración de DisfracesLy</h2>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-2 rounded-xl transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Idioma */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface font-medium">
              <FiGlobe className="text-primary" />
              <h3>Idioma</h3>
            </div>
            <select className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
              <option value="es-AR">Español (Argentina)</option>
              <option value="es-ES">Español (España)</option>
              <option value="en-US">English (US)</option>
            </select>
          </section>

          {/* Notificaciones */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface font-medium">
              <FiBell className="text-primary" />
              <h3>Notificaciones</h3>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 border border-outline-variant/20 rounded-xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                <span className="text-sm text-on-surface">Alertas del sistema</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary rounded cursor-pointer" />
              </label>
              <label className="flex items-center justify-between p-3 border border-outline-variant/20 rounded-xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                <span className="text-sm text-on-surface">Nuevas reservas</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary rounded cursor-pointer" />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
