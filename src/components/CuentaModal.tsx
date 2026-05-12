import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCompanyStore } from '@/store/useCompanyStore';

type PacienteOption = { id: string; nombre_completo: string; codigo_interno: string | null };
type ServicioOption = { id: string; nombre: string; costo_hnl: number };

type CuentaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CuentaModal({ isOpen, onClose, onSuccess }: CuentaModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [servicios, setServicios] = useState<ServicioOption[]>([]);
  const { activeCompany } = useCompanyStore();
  
  // Form
  const [pacienteId, setPacienteId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [concepto, setConcepto] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [descuentoTipo, setDescuentoTipo] = useState('fijo');
  const [descuentoValor, setDescuentoValor] = useState('0');
  const [notas, setNotas] = useState('');

  const loadData = useCallback(async () => {
    if (!activeCompany) return;
    const { data: pData } = await supabase
      .from('pacientes')
      .select('id, nombre_completo, codigo_interno')
      .eq('company_id', activeCompany.id)
      .eq('activo', true)
      .returns<PacienteOption[]>();
    if (pData) setPacientes(pData);

    const { data: sData } = await supabase
      .from('servicios')
      .select('id, nombre, costo_hnl')
      .eq('company_id', activeCompany.id)
      .eq('activo', true)
      .returns<ServicioOption[]>();
    if (sData) setServicios(sData);
  }, [supabase, activeCompany]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleServicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sid = e.target.value;
    setServicioId(sid);
    const s = servicios.find(x => x.id === sid);
    if (s) {
      setSubtotal(s.costo_hnl.toString());
      setConcepto(`Cobro: ${s.nombre}`);
    }
  };

  const calcularTotal = () => {
    const st = parseFloat(subtotal) || 0;
    const dv = parseFloat(descuentoValor) || 0;
    if (descuentoTipo === 'porcentaje') {
      return st - (st * (dv / 100));
    }
    return st - dv;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId || !fechaVencimiento) return;
    
    setLoading(true);
    const total = calcularTotal();

    const payload = {
      paciente_id: pacienteId,
      servicio_id: servicioId || null,
      monto_total: total,
      subtotal: parseFloat(subtotal) || 0,
      descuento_tipo: descuentoTipo,
      descuento_valor: parseFloat(descuentoValor) || 0,
      fecha_vencimiento: fechaVencimiento,
      estado: 'al_dia', // o 'por_vencer' dependiendo la fecha, pero iniciamos como al_dia
      notas,
      monto_pagado: 0,
      company_id: activeCompany?.id
    };

    const { error } = await supabase.from('cuentas_por_cobrar').insert([payload]);
    
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Registrar Nueva Cuenta (Deuda)</h2>
            <p className="text-sm text-slate-500">Crea un cobro manual para un paciente</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Paciente *</label>
            <select required value={pacienteId} onChange={e=>setPacienteId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm">
              <option value="">-- Selecciona un paciente --</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre_completo} ({p.codigo_interno})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Servicio Relacionado (Opcional)</label>
            <select value={servicioId} onChange={handleServicioChange} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm">
              <option value="">-- Cobro general independiente --</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Concepto *</label>
              <input type="text" required value={concepto} onChange={e=>setConcepto(e.target.value)} placeholder="Ej. Colegiatura Marzo" className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento *</label>
              <input type="date" required value={fechaVencimiento} onChange={e=>setFechaVencimiento(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtotal (HNL)</label>
              <input type="number" required min="0" step="0.01" value={subtotal} onChange={e=>setSubtotal(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descuento</label>
              <div className="flex">
                <input type="number" min="0" step="0.01" value={descuentoValor} onChange={e=>setDescuentoValor(e.target.value)} className="w-full px-3 py-2 rounded-l-xl border border-border bg-slate-50 text-sm font-mono border-r-0" />
                <select value={descuentoTipo} onChange={e=>setDescuentoTipo(e.target.value)} className="px-2 py-2 rounded-r-xl border border-border bg-slate-100 text-sm">
                  <option value="fijo">L</option>
                  <option value="porcentaje">%</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total a Pagar</label>
              <div className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-sm font-mono font-bold">
                L {calcularTotal().toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas Internas</label>
            <textarea rows={2} value={notas} onChange={e=>setNotas(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-brand-500/20 text-sm resize-none" />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Generar Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
