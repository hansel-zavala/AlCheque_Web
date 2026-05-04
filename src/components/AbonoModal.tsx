import { useState } from 'react';
import { X, HandCoins, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type AbonoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cuenta: any;
  onSuccess: () => void;
};

export function AbonoModal({ isOpen, onClose, cuenta, onSuccess }: AbonoModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState('efectivo');
  const [comprobante, setComprobante] = useState('');

  if (!isOpen || !cuenta) return null;

  const saldoPendiente = parseFloat(cuenta.monto_total) - parseFloat(cuenta.monto_pagado);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const abonoMonto = parseFloat(monto);
    if (!abonoMonto || abonoMonto <= 0) return;

    setLoading(true);

    // 1. Insertar el abono
    const { error: abonoError } = await supabase.from('abonos').insert([{
      cuenta_id: cuenta.id,
      monto: abonoMonto,
      fecha: fecha,
      metodo_pago: metodo,
      comprobante_referencia: comprobante
    }]);

    if (abonoError) {
      alert(abonoError.message);
      setLoading(false);
      return;
    }

    // 2. Actualizar la cuenta (monto_pagado y estado)
    const nuevoPagado = parseFloat(cuenta.monto_pagado) + abonoMonto;
    const nuevoEstado = nuevoPagado >= parseFloat(cuenta.monto_total) ? 'pagada' : cuenta.estado;

    const { error: updateError } = await supabase.from('cuentas_por_cobrar').update({
      monto_pagado: nuevoPagado,
      estado: nuevoEstado
    }).eq('id', cuenta.id);

    if (updateError) {
      alert(updateError.message);
      setLoading(false);
      return;
    }

    // 3. Crear Transacción de Ingreso automática para que afecte el Dashboard y Flujo de Caja
    // Buscamos la categoría "Cobro de Servicios"
    let { data: catData } = await supabase.from('categorias').select('id').eq('nombre', 'Cobro de Servicios').eq('tipo', 'ingreso').maybeSingle();
    let catId = catData?.id;

    if (!catId) {
      // Si no existe, la creamos al vuelo
      const { data: newCat } = await supabase.from('categorias').insert([{ nombre: 'Cobro de Servicios', tipo: 'ingreso' }]).select().single();
      catId = newCat?.id;
    }

    await supabase.from('transacciones').insert([{
      tipo: 'ingreso',
      monto_hnl: abonoMonto,
      fecha: fecha,
      descripcion: `Cobro: ${cuenta.pacientes?.nombre_completo} - ${cuenta.servicios?.nombre || 'General'}`,
      categoria_id: catId,
      metodo_pago: metodo,
      estado: 'pagado'
    }]);

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Registrar Abono</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-brand-50 border-b border-brand-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-brand-600 font-bold uppercase">Saldo Pendiente</p>
            <p className="text-2xl font-black text-brand-700 font-mono">L {saldoPendiente.toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto a Abonar (HNL) *</label>
            <input type="number" required min="0.01" step="0.01" max={saldoPendiente} value={monto} onChange={e=>setMonto(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-lg font-mono font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
              <input type="date" required value={fecha} onChange={e=>setFecha(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Método</label>
              <select required value={metodo} onChange={e=>setMetodo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Referencia (Recibo/Transacción)</label>
            <input type="text" value={comprobante} onChange={e=>setComprobante(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm" />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium flex justify-center items-center gap-2 transition-all shadow-sm disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <HandCoins size={18} />} Guardar Abono
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
