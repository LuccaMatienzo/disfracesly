import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useOperacion, useAvanzarEtapaAlquiler, useAvanzarEtapaVenta, useCreateInteraccion } from '@/hooks/useOperaciones';
import { usePagos } from '@/hooks/usePagos';
import { useToast } from '@/hooks/useToast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import PagoFormModal from '@/components/ui/PagoFormModal';
import ToastContainer from '@/components/ui/Toast';
import InteraccionModal from '@/components/ui/InteraccionModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v) {
  return `$${parseFloat(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', opts);
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-AR', {
    day: 'numeric', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `hace ${diffDays}d`;
}

const TIPO_PAGO_LABELS = {
  SENA: 'Seña',
  DEPOSITO: 'Depósito',
  SALDO: 'Saldo',
  DEVOLUCION_DEPOSITO: 'Devolución depósito',
  AJUSTE: 'Ajuste',
};

const METODO_ICONS = {
  EFECTIVO: 'payments',
  TRANSFERENCIA: 'account_balance',
};

const TIPO_INTERACCION_LABELS = {
  RETIRO: 'Retiro',
  DEVOLUCION: 'Devolución',
  OTRA: 'Otra',
};

// Etapa transitions
const ALQUILER_TRANSITIONS = {
  RESERVADO: { next: 'LISTO_PARA_RETIRO', label: 'Marcar listo para retiro', icon: 'inventory_2' },
  LISTO_PARA_RETIRO: { next: 'RETIRADO', label: 'Confirmar retiro', icon: 'local_shipping' },
  RETIRADO: { next: 'DEVUELTO', label: 'Confirmar devolución', icon: 'assignment_return' },
};

const VENTA_TRANSITIONS = {
  RESERVADO: { next: 'LISTO_PARA_ENTREGA', label: 'Marcar listo para entrega', icon: 'inventory_2' },
  LISTO_PARA_ENTREGA: { next: 'VENDIDO', label: 'Confirmar entrega', icon: 'sell' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-24 bg-surface-container rounded-lg" />
      <div className="h-10 w-72 bg-surface-container rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl h-48" />
          <div className="bg-surface-container-lowest rounded-2xl h-64" />
        </div>
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl h-48" />
          <div className="bg-surface-container-lowest rounded-2xl h-40" />
        </div>
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, accent }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {icon && (
        <span className="material-symbols-outlined text-lg text-on-surface-variant mt-0.5">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${accent ?? 'text-on-surface'}`}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────

function EtapaStepper({ etapa, etapas }) {
  const currentIdx = etapas.indexOf(etapa);

  return (
    <div className="flex items-start w-full justify-between">
      {etapas.map((step, i) => {
        const isComplete = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isCancelled = etapa === 'CANCELADO';

        return (
          <div key={step} className="flex flex-col items-center flex-1 relative">
            {/* Line to next step */}
            {i < etapas.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full px-4">
                <div className={`h-0.5 rounded-full ${i < currentIdx ? 'bg-primary' : 'bg-outline-variant/30'}`} />
              </div>
            )}

            {/* Dot */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative z-10 ${
                isCancelled && isCurrent
                  ? 'bg-error text-white'
                  : isComplete
                    ? 'bg-primary text-white'
                    : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {isComplete ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                i + 1
              )}
            </div>

            {/* Text */}
            <span className={`text-[9px] font-label uppercase tracking-wider mt-1.5 whitespace-nowrap text-center ${
              isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}>
              {step.replace(/_/g, ' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OperacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: op, isLoading, isError } = useOperacion(id);
  const { createPago, updatePago, deletePago } = usePagos(id);
  const { toasts, success, error, remove } = useToast();

  const avanzarAlquiler = useAvanzarEtapaAlquiler();
  const avanzarVenta = useAvanzarEtapaVenta();
  const createInteraccion = useCreateInteraccion(id);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [interaccionModal, setInteraccionModal] = useState({ open: false, tipo: null });

  // Pago Modals state
  const [pagoModal, setPagoModal] = useState({ open: false, data: null });
  const [pagoDeleteTarget, setPagoDeleteTarget] = useState(null);

  if (isLoading) return <Skeleton />;

  if (isError || !op) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-error mb-4 block">error</span>
        <h2 className="text-xl font-headline font-bold text-on-surface">Operación no encontrada</h2>
        <p className="text-on-surface-variant mt-1">No se pudo cargar la operación #{id}</p>
        <Button variant="secondary" className="mt-6" onClick={() => navigate('/admin/operaciones')}>
          Volver a operaciones
        </Button>
      </div>
    );
  }

  const isAlquiler = !!op.alquiler;
  const isVenta = !!op.venta;
  const tipo = isAlquiler ? 'Alquiler' : 'Venta';
  const etapa = isAlquiler ? op.alquiler.etapa : op.venta?.etapa;
  const clienteNombre = `${op.cliente?.persona?.nombre ?? ''} ${op.cliente?.persona?.apellido ?? ''}`.trim();
  const clienteDoc = op.cliente?.persona?.documento ?? '—';
  const clienteTel = op.cliente?.telefono ?? '—';
  const clienteDom = op.cliente?.domicilio ?? '—';

  const etapasAlquiler = ['RESERVADO', 'LISTO_PARA_RETIRO', 'RETIRADO', 'DEVUELTO'];
  const etapasVenta = ['RESERVADO', 'LISTO_PARA_ENTREGA', 'VENDIDO'];
  const etapas = isAlquiler ? etapasAlquiler : etapasVenta;

  const transition = isAlquiler ? ALQUILER_TRANSITIONS[etapa] : VENTA_TRANSITIONS[etapa];
  const isTerminal = etapa === 'DEVUELTO' || etapa === 'VENDIDO' || etapa === 'CANCELADO';

  // Financial computations
  const pagos = op.pagos ?? [];
  const montoTotal = op.estado_financiero?.monto_total ?? parseFloat(op.monto_total ?? 0);
  const totalPagado = op.estado_financiero?.total_pagado ?? 0;
  const saldoPendiente = op.estado_financiero?.saldo_pendiente ?? 0;

  // Alquiler specific
  const depositoMonto = isAlquiler ? (op.estado_financiero?.deposito_garantia ?? parseFloat(op.alquiler.deposito_monto ?? 0)) : 0;
  const depositoDevuelto = isAlquiler ? (op.estado_financiero?.deposito_devuelto ?? parseFloat(op.alquiler.deposito_devuelto_monto ?? 0)) : 0;
  const depositoRetenido = Math.max(0, depositoMonto - depositoDevuelto);

  // Venta specific
  const senaMonto = isVenta ? parseFloat(op.venta.sena_monto ?? 0) : 0;

  async function handleAdvance() {
    if (!transition) return;
    
    // Tanto Alquiler como Venta abren el modal de interacción para registrar quién retira/recibe
    if (transition.next === 'RETIRADO' || transition.next === 'VENDIDO') {
      setInteraccionModal({ open: true, tipo: 'RETIRO' });
      return;
    }
    if (transition.next === 'DEVUELTO') {
      setInteraccionModal({ open: true, tipo: 'DEVOLUCION' });
      return;
    }

    setAdvanceLoading(true);
    try {
      if (isAlquiler) {
        await avanzarAlquiler.mutateAsync({ id: op.id_operacion, etapa: transition.next });
      } else {
        await avanzarVenta.mutateAsync({ id: op.id_operacion, etapa: transition.next });
      }
    } finally {
      setAdvanceLoading(false);
    }
  }

  const handleInteraccionSubmit = async (payload) => {
    try {
      await createInteraccion.mutateAsync(payload);
      
      if (isAlquiler) {
        const nextEtapa = payload.tipo === 'RETIRO' ? 'RETIRADO' : 'DEVUELTO';
        await avanzarAlquiler.mutateAsync({ id: op.id_operacion, etapa: nextEtapa });
      } else {
        // En ventas, el 'RETIRO' (que semánticamente es Entrega) avanza a 'VENDIDO'
        const nextEtapa = payload.tipo === 'RETIRO' ? 'VENDIDO' : 'CANCELADO';
        await avanzarVenta.mutateAsync({ id: op.id_operacion, etapa: nextEtapa });
      }
      
      const textoAccion = payload.tipo === 'RETIRO' ? (isVenta ? 'la entrega' : 'el retiro') : 'la devolución';
      success(`Se ha registrado ${textoAccion} correctamente`);
      setInteraccionModal({ open: false, tipo: null });
    } catch (err) {
      error(err?.response?.data?.message ?? `Error al registrar la acción`);
    }
  };

  async function handleCancel() {
    setAdvanceLoading(true);
    try {
      if (isAlquiler) {
        await avanzarAlquiler.mutateAsync({ id: op.id_operacion, etapa: 'CANCELADO' });
      } else {
        await avanzarVenta.mutateAsync({ id: op.id_operacion, etapa: 'CANCELADO' });
      }
      setShowCancelModal(false);
    } finally {
      setAdvanceLoading(false);
    }
  }

  // Pago Handlers
  const handlePagoSubmit = async (data) => {
    try {
      if (pagoModal.data) {
        await updatePago.mutateAsync({ id: pagoModal.data.id_pago_operacion, ...data });
        success('Pago actualizado correctamente');
      } else {
        await createPago.mutateAsync(data);
        success('Pago registrado correctamente');
      }
      setPagoModal({ open: false, data: null });
    } catch (err) {
      error(err?.response?.data?.message ?? 'Error al procesar el pago');
    }
  };

  const handlePagoDelete = async () => {
    try {
      await deletePago.mutateAsync(pagoDeleteTarget.id_pago_operacion);
      success('Pago eliminado correctamente');
      setPagoDeleteTarget(null);
    } catch (err) {
      error(err?.response?.data?.message ?? 'Error al eliminar el pago');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/admin/operaciones')}
          className="text-body-md text-primary hover:underline font-label mb-2 inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Operaciones
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-headline-md font-bold text-on-surface">
              {tipo} #{op.id_operacion}
            </h1>
            <Badge value={etapa} />
          </div>
          <div className="flex items-center gap-2">
            {transition && !isTerminal && (
              <Button onClick={handleAdvance} loading={advanceLoading}>
                <span className="material-symbols-outlined text-base">{transition.icon}</span>
                {transition.label}
              </Button>
            )}
            {!isTerminal && (
              <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)}>
                <span className="material-symbols-outlined text-base">cancel</span>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stepper ─────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <EtapaStepper etapa={etapa} etapas={etapas} />
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column (2/3) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client info */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-primary">person</span>
              </div>
              <div>
                <h2 className="font-headline text-title-md text-on-surface">Cliente</h2>
                <p className="text-body-md text-on-surface-variant">{clienteNombre}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-outline-variant/15 pt-4">
              <InfoRow icon="badge" label="Documento" value={clienteDoc} />
              <InfoRow icon="call" label="Teléfono" value={clienteTel} />
              <InfoRow icon="home" label="Domicilio" value={clienteDom} />
            </div>
          </div>

          {/* Piezas */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-secondary">checkroom</span>
              </div>
              <div>
                <h2 className="font-headline text-title-md text-on-surface">
                  Piezas ({op.detalles?.length ?? 0})
                </h2>
                <p className="text-body-md text-on-surface-variant">Items incluidos en la operación</p>
              </div>
            </div>
            <div className="space-y-2">
              {(op.detalles ?? []).map((det) => {
                const ps = det.piezaStock;
                const pieza = ps?.pieza;
                const img = pieza?.imagenes?.[0]?.imagen;
                return (
                  <div
                    key={det.id_operacion_detalle}
                    className="flex items-center gap-4 p-3 rounded-xl border border-outline-variant/15 hover:bg-surface-container-low/40 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                      {img?.thumbnail_url || img?.url ? (
                        <img
                          src={img.thumbnail_url ?? img.url}
                          alt={pieza?.nombre ?? 'Pieza'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                          dry_cleaning
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {pieza?.nombre ?? 'Pieza eliminada'}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Stock #{ps?.id_pieza_stock} · Talle: {ps?.talle ?? 'N/A'}
                      </p>
                    </div>
                    {/* Status */}
                    <Badge value={ps?.estado_pieza_stock ?? 'DISPONIBLE'} />
                  </div>
                );
              })}
              {(op.detalles ?? []).length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">Sin piezas registradas</p>
              )}
            </div>
          </div>

          {/* Pagos */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-primary">payments</span>
                </div>
                <div>
                  <h2 className="font-headline text-title-md text-on-surface">
                    Pagos ({pagos.length})
                  </h2>
                  <p className="text-body-md text-on-surface-variant">Historial de pagos registrados</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setPagoModal({ open: true, data: null })}>
                <span className="material-symbols-outlined text-base">add</span>
                Nuevo Pago
              </Button>
            </div>

            {pagos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/15">
                      {['Tipo', 'Método', 'Monto', 'Fecha', 'Responsable', 'Acciones'].map(h => (
                        <th key={h} className={`text-left px-3 py-2.5 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant ${h === 'Acciones' ? 'text-center' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago, i) => (
                      <tr
                        key={pago.id_pago_operacion}
                        className={`border-b border-outline-variant/10 last:border-0 ${i % 2 ? 'bg-surface-container-low/30' : ''}`}
                      >
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${
                            pago.tipo === 'DEVOLUCION_DEPOSITO' ? 'text-error' : 'text-on-surface'
                          }`}>
                            {TIPO_PAGO_LABELS[pago.tipo] ?? pago.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">
                              {METODO_ICONS[pago.metodo] ?? 'money'}
                            </span>
                            {pago.metodo === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-semibold text-on-surface">
                          {fmt(pago.monto)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-on-surface-variant">
                          {fmtDateTime(pago.fecha)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-on-surface-variant">
                          {pago.persona
                            ? `${pago.persona.nombre} ${pago.persona.apellido}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <ActionButtons
                            onEdit={() => setPagoModal({ open: true, data: pago })}
                            onDelete={() => setPagoDeleteTarget(pago)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-4">Sin pagos registrados</p>
            )}
          </div>

          {/* Interacciones / Timeline */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-tertiary">history</span>
              </div>
              <h2 className="font-headline text-title-md text-on-surface">Interacciones</h2>
            </div>

            {(op.interacciones ?? []).length > 0 ? (
              <div className="relative pl-6 border-l-2 border-outline-variant/20 space-y-4">
                {(op.interacciones ?? []).map((inter) => (
                  <div key={inter.id_interaccion_operacion} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-on-surface">
                          {inter.tipo === 'RETIRO' ? (isVenta ? 'Entrega' : 'Retiro') : TIPO_INTERACCION_LABELS[inter.tipo] ?? inter.tipo}
                        </p>
                        <p className="text-[11px] font-medium text-on-surface mt-2">
                          {inter.tipo === 'RETIRO' ? (isVenta ? 'Entregado a' : 'Retirado por') : inter.tipo === 'DEVOLUCION' ? 'Devuelto por' : 'Acción registrada por'}: <span className="text-primary">{inter.persona?.nombre} {inter.persona?.apellido}</span>
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {inter.tipo === 'RETIRO' ? 'Entregado por' : inter.tipo === 'DEVOLUCION' ? 'Recibido por' : 'Usuario'}: {inter.usuario?.persona?.nombre} {inter.usuario?.persona?.apellido}
                        </p>
                        {inter.observaciones && (
                          <p className="text-xs text-on-surface-variant mt-2 italic bg-surface-container-low/50 p-2 rounded-lg border border-outline-variant/10">
                            <strong>Observaciones:</strong> {inter.observaciones}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{timeAgo(inter.fecha_hora)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-4">Sin interacciones registradas</p>
            )}
          </div>
        </div>

        {/* ── Right Column (1/3) ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Resumen financiero */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <h2 className="font-headline text-title-md text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">receipt_long</span>
              Resumen financiero
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/15">
                <span className="text-sm text-on-surface-variant">Monto total</span>
                <span className="text-lg font-headline font-black text-on-surface">{fmt(montoTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/15">
                <span className="text-sm text-on-surface-variant">Total pagado</span>
                <span className="text-sm font-semibold text-primary">{fmt(totalPagado)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/15">
                <span className="text-sm text-on-surface-variant">Saldo pendiente</span>
                <span className={`text-sm font-semibold ${saldoPendiente > 0 ? 'text-error' : 'text-primary'}`}>
                  {fmt(saldoPendiente)}
                </span>
              </div>

              {/* Alquiler-specific deposit info */}
              {isAlquiler && (
                <>
                  <div className="mt-2 pt-3 border-t border-outline-variant/15">
                    <p className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Depósito
                    </p>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-on-surface-variant">Monto depósito</span>
                      <span className="text-sm font-medium text-on-surface">{fmt(depositoMonto)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-on-surface-variant">Devuelto</span>
                      <span className="text-sm font-medium text-primary">{fmt(depositoDevuelto)}</span>
                    </div>
                    {depositoRetenido > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-on-surface-variant">Retenido</span>
                        <span className="text-sm font-medium text-error">{fmt(depositoRetenido)}</span>
                      </div>
                    )}
                    {op.alquiler.deposito_motivo_retencion && (
                      <p className="text-xs text-on-surface-variant mt-1 bg-error/5 p-2 rounded-lg">
                        Motivo: {op.alquiler.deposito_motivo_retencion}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Venta-specific seña info */}
              {isVenta && senaMonto > 0 && (
                <div className="mt-2 pt-3 border-t border-outline-variant/15">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-on-surface-variant">Seña registrada</span>
                    <span className="text-sm font-medium text-on-surface">{fmt(senaMonto)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detalles de la operación */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <h2 className="font-headline text-title-md text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-secondary">info</span>
              Detalles
            </h2>
            <div className="space-y-1">
              <InfoRow icon="tag" label="Tipo" value={tipo} accent={isAlquiler ? 'text-primary' : 'text-secondary'} />
              <InfoRow icon="event" label="Fecha constitución" value={fmtDate(op.fecha_constitucion)} />
              {op.fecha_retiro && (
                <InfoRow icon="today" label="Fecha retiro" value={fmtDate(op.fecha_retiro)} />
              )}
              {isAlquiler && op.alquiler.fecha_devolucion && (
                <InfoRow
                  icon="event_upcoming"
                  label="Fecha devolución"
                  value={fmtDate(op.alquiler.fecha_devolucion)}
                  accent={
                    new Date(op.alquiler.fecha_devolucion) < new Date() && etapa === 'RETIRADO'
                      ? 'text-error font-bold'
                      : undefined
                  }
                />
              )}
              {isVenta && op.venta.fecha_entrega_estimada && (
                <InfoRow icon="event_upcoming" label="Entrega estimada" value={fmtDate(op.venta.fecha_entrega_estimada)} />
              )}
              {isVenta && op.venta.especificaciones_medidas && (
                <InfoRow icon="straighten" label="Especificaciones medidas" value={op.venta.especificaciones_medidas} />
              )}
            </div>
          </div>

          {/* Observaciones */}
          {op.observaciones && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
              <h2 className="font-headline text-title-md text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-tertiary">sticky_note_2</span>
                Observaciones
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{op.observaciones}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* Pago Add/Edit */}
      <PagoFormModal
        open={pagoModal.open}
        onClose={() => setPagoModal({ open: false, data: null })}
        onSubmit={handlePagoSubmit}
        loading={createPago.isPending || updatePago.isPending}
        initialData={pagoModal.data}
      />

      {/* Pago Confirm Delete */}
      <ConfirmDeleteModal
        open={!!pagoDeleteTarget}
        onClose={() => setPagoDeleteTarget(null)}
        onConfirm={handlePagoDelete}
        entityName={`pago de ${fmt(pagoDeleteTarget?.monto)}`}
        loading={deletePago.isPending}
      />

      {/* Cancelación de operación */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar operación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Volver
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={advanceLoading}>
              Sí, cancelar
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-5xl text-error mb-3 block">warning</span>
          <p className="text-on-surface font-medium">
            ¿Estás seguro de que querés cancelar el {tipo.toLowerCase()} #{op.id_operacion}?
          </p>
          <p className="text-sm text-on-surface-variant mt-2">
            Esta acción devolverá las piezas al estado <strong>Disponible</strong> y no se puede deshacer.
          </p>
        </div>
      </Modal>

      {/* Interacción (Retiro/Devolución) */}
      <InteraccionModal
        open={interaccionModal.open}
        onClose={() => setInteraccionModal({ open: false, tipo: null })}
        onSubmit={handleInteraccionSubmit}
        loading={createInteraccion.isPending || avanzarAlquiler.isPending}
        tipo={interaccionModal.tipo}
        operacion={op}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
