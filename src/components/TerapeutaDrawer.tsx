'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, User, DollarSign, Loader2, Save, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { formatLocalDateInputValue } from '@/utils/date';
import { useCompanyStore } from '@/store/useCompanyStore';

type TerapeutaRow = {
  id: string;
  nombre: string;
  puesto: string;
  salario_mensual: number;
  telefono: string | null;
  email: string | null;
  activo: boolean;
};

type PagoMes = {
  id: string;
  mes: number;
  anio: number;
  monto_total: number;
  monto_pagado: number;
  estado: string;
  notas: string | null;
};

type AbonoSalario = {
  id: string;
  monto: number;
  fecha: string;
  metodo_pago: string | null;
  notas: string | null;
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface TerapeutaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  terapeutaId: string | null;
  onSuccess: () => void;
}

export function TerapeutaDrawer({ isOpen, onClose, terapeutaId, onSuccess }: TerapeutaDrawerProps) {
  const supabase = useMemo(() => createClient(), []);
  const { activeCompany } = useCompanyStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'salarios'>('perfil');

  // Perfil
  const [nombre, setNombre] = useState('');
  const [puesto, setPuesto] = useState('');
  const [salarioMensual, setSalarioMensual] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Salarios
  const [pagos, setPagos] = useState<PagoMes[]>([]);
  const [selectedPagoId, setSelectedPagoId] = useState<string | null>(null);
  const [abonos, setAbonos] = useState<AbonoSalario[]>([]);

  // Formulario nuevo abono
  const [montoAbono, setMontoAbono] = useState('');
  const [fechaAbono, setFechaAbono] = useState(formatLocalDateInputValue());
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [notasAbono, setNotasAbono] = useState('');

  const now = new Date();
  const mesActual = now.getMonth() + 1;
  const anioActual = now.getFullYear();

  const resetForm = () => {
    setNombre(''); setPuesto(''); setSalarioMensual(''); setTelefono(''); setEmail('');
    setPagos([]); setAbonos([]); setSelectedPagoId(null);
    setActiveTab('perfil');
  };

  const loadTerapeuta = useCallback(async (id: string) => {
    setLoading(true);
    const { data } = await supabase.from('terapeutas').select('*').eq('id', id).single();
    if (data) {
      const row = data as unknown as TerapeutaRow;
      setNombre(row.nombre); setPuesto(row.puesto);
      setSalarioMensual(String(row.salario_mensual));
      setTelefono(row.telefono || ''); setEmail(row.email || '');
    }
    setLoading(false);
  }, [supabase]);

  const loadPagos = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('pagos_salario')
      .select('*')
      .eq('terapeuta_id', id)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false });
    if (data) setPagos(data as PagoMes[]);
  }, [supabase]);

  const loadAbonos = useCallback(async (pagoId: string) => {
    const { data } = await supabase
      .from('abonos_salario')
      .select('*')
      .eq('pago_id', pagoId)
      .order('fecha', { ascending: false });
    if (data) setAbonos(data as AbonoSalario[]);
  }, [supabase]);

  useEffect(() => {
    if (!isOpen) return;
    if (terapeutaId) {
      loadTerapeuta(terapeutaId);
      loadPagos(terapeutaId);
    } else {
      resetForm();
    }
  }, [isOpen, terapeutaId, loadTerapeuta, loadPagos]);

  useEffect(() => {
    if (selectedPagoId) loadAbonos(selectedPagoId);
    else setAbonos([]);
  }, [selectedPagoId, loadAbonos]);

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { nombre, puesto, salario_mensual: parseFloat(salarioMensual) || 0, telefono: telefono || null, email: email || null, company_id: activeCompany?.id };
    if (terapeutaId) {
      await supabase.from('terapeutas').update(payload).eq('id', terapeutaId);
    } else {
      await supabase.from('terapeutas').insert([payload]);
    }
    onSuccess();
    setSaving(false);
    if (!terapeutaId) onClose();
  };

  const handleGenerarPagoMes = async () => {
    if (!terapeutaId || !activeCompany) return;
    setSaving(true);
    const { error } = await supabase.from('pagos_salario').insert([{
      terapeuta_id: terapeutaId,
      company_id: activeCompany.id,
      mes: mesActual,
      anio: anioActual,
      monto_total: parseFloat(salarioMensual) || 0,
      monto_pagado: 0,
      estado: 'pendiente',
    }]);
    if (error) alert('Ya existe un registro para este mes.');
    else await loadPagos(terapeutaId);
    setSaving(false);
  };

  const handleRegistrarAbono = async () => {
    if (!selectedPagoId || !activeCompany || !montoAbono) return;
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) return;
    setSaving(true);

    const pago = pagos.find(p => p.id === selectedPagoId);
    if (!pago) { setSaving(false); return; }

    // Insertar abono
    await supabase.from('abonos_salario').insert([{
      pago_id: selectedPagoId,
      company_id: activeCompany.id,
      monto,
      fecha: fechaAbono,
      metodo_pago: metodoPago || null,
      notas: notasAbono || null,
    }]);

    // Actualizar monto_pagado y estado en pagos_salario
    const nuevoMontoPagado = pago.monto_pagado + monto;
    const nuevoEstado = nuevoMontoPagado >= pago.monto_total ? 'pagado' : 'parcial';
    await supabase.from('pagos_salario').update({
      monto_pagado: nuevoMontoPagado,
      estado: nuevoEstado,
    }).eq('id', selectedPagoId);

    // Registrar como egreso en transacciones
    const { data: catData } = await supabase.from('categorias').select('id')
      .eq('nombre', 'Salarios').eq('tipo', 'egreso').eq('company_id', activeCompany.id).limit(1);
    let catId = catData?.[0]?.id;
    if (!catId) {
      const { data: nc } = await supabase.from('categorias').insert([{ nombre: 'Salarios', tipo: 'egreso', company_id: activeCompany.id }]).select().single();
      catId = nc?.id;
    }
    if (catId) {
      await supabase.from('transacciones').insert([{
        tipo: 'egreso',
        monto_hnl: monto,
        fecha: fechaAbono,
        descripcion: `Salario ${nombre} - ${MESES[pago.mes - 1]} ${pago.anio}`,
        categoria_id: catId,
        metodo_pago: metodoPago || 'efectivo',
        estado: 'pagado',
        company_id: activeCompany.id,
      }]);
    }

    setMontoAbono(''); setNotasAbono('');
    await loadPagos(terapeutaId!);
    await loadAbonos(selectedPagoId);
    onSuccess();
    setSaving(false);
  };

  if (!isOpen) return null;

  const selectedPago = pagos.find(p => p.id === selectedPagoId);
  const pagoMesActual = pagos.find(p => p.mes === mesActual && p.anio === anioActual);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-left overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{terapeutaId ? nombre || 'Terapeuta' : 'Nuevo Terapeuta'}</h2>
            <p className="text-sm text-slate-500">{terapeutaId ? puesto : 'Completa los datos para registrar'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
        </div>

        {/* Tabs */}
        {terapeutaId && (
          <div className="flex border-b border-border px-2 shrink-0 bg-white">
            {([
              { key: 'perfil', icon: <User size={15}/>, label: 'Datos' },
              { key: 'salarios', icon: <DollarSign size={15}/>, label: 'Salarios' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
          ) : activeTab === 'perfil' ? (
            <form id="terapeutaForm" onSubmit={handleSavePerfil} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo *</label>
                  <input required value={nombre} onChange={e => setNombre(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Puesto *</label>
                  <input required value={puesto} onChange={e => setPuesto(e.target.value)} placeholder="Ej. Terapeuta Ocupacional" className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Salario Mensual (L) *</label>
                  <input required type="number" min="0" step="0.01" value={salarioMensual} onChange={e => setSalarioMensual(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Correo Electrónico</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                </div>
              </div>
            </form>
          ) : (
            /* TAB SALARIOS */
            <div className="space-y-5">
              {/* Resumen mes actual */}
              <div className={`rounded-xl border p-4 ${pagoMesActual?.estado === 'pagado' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-800">Salario {MESES[mesActual-1]} {anioActual}</h4>
                  {pagoMesActual ? (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pagoMesActual.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {pagoMesActual.estado === 'pagado' ? 'Pagado' : pagoMesActual.estado === 'parcial' ? 'Parcial' : 'Pendiente'}
                    </span>
                  ) : <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Sin registro</span>}
                </div>
                {pagoMesActual ? (
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-600">Pagado: <strong className="text-slate-800 font-mono">L {pagoMesActual.monto_pagado.toFixed(2)}</strong></span>
                    <span className="text-slate-600">Pendiente: <strong className="text-orange-700 font-mono">L {(pagoMesActual.monto_total - pagoMesActual.monto_pagado).toFixed(2)}</strong></span>
                  </div>
                ) : (
                  <button onClick={handleGenerarPagoMes} disabled={saving}
                    className="mt-2 w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    <Plus size={14}/> Generar Registro de Salario
                  </button>
                )}
              </div>

              {/* Lista de meses */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historial de Pagos</h4>
                {pagos.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">No hay registros de salario aún.</p>
                ) : (
                  <div className="space-y-2">
                    {pagos.map(p => {
                      const saldo = p.monto_total - p.monto_pagado;
                      const isSelected = selectedPagoId === p.id;
                      return (
                        <div key={p.id} className={`border rounded-xl transition-all ${isSelected ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <button className="w-full flex items-center justify-between p-3 text-left" onClick={() => setSelectedPagoId(isSelected ? null : p.id)}>
                            <div className="flex items-center gap-2">
                              {p.estado === 'pagado' ? <CheckCircle2 size={16} className="text-green-500"/> : <Clock size={16} className="text-orange-400"/>}
                              <span className="text-sm font-semibold text-slate-700">{MESES[p.mes-1]} {p.anio}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono font-bold text-slate-700">L {p.monto_pagado.toFixed(2)} / {p.monto_total.toFixed(2)}</p>
                              {saldo > 0 && <p className="text-[10px] text-orange-500">Saldo: L {saldo.toFixed(2)}</p>}
                            </div>
                          </button>

                          {isSelected && p.estado !== 'pagado' && (
                            <div className="px-3 pb-3 border-t border-brand-100 pt-3 space-y-3">
                              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Registrar Abono</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Monto (L)</label>
                                  <input type="number" min="0.01" step="0.01" max={saldo} value={montoAbono} onChange={e => setMontoAbono(e.target.value)}
                                    className="px-3 py-1.5 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" placeholder="0.00" />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Fecha</label>
                                  <input type="date" value={fechaAbono} onChange={e => setFechaAbono(e.target.value)}
                                    className="px-3 py-1.5 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Método de Pago</label>
                                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                                    className="px-3 py-1.5 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20">
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Notas</label>
                                  <input value={notasAbono} onChange={e => setNotasAbono(e.target.value)} placeholder="Opcional"
                                    className="px-3 py-1.5 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                                </div>
                              </div>
                              <button onClick={handleRegistrarAbono} disabled={saving || !montoAbono}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                {saving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
                                Registrar Abono
                              </button>
                            </div>
                          )}

                          {isSelected && abonos.length > 0 && (
                            <div className="px-3 pb-3 space-y-1">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2 mb-1">Abonos Realizados</p>
                              {abonos.map(a => (
                                <div key={a.id} className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5">
                                  <span>{new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-HN')} · {a.metodo_pago || 'Efectivo'}</span>
                                  <span className="font-mono font-bold text-green-700">L {a.monto.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-white flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">Cerrar</button>
          {activeTab === 'perfil' && (
            <button type="submit" form="terapeutaForm" disabled={saving}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
