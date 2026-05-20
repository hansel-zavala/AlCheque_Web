'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, GraduationCap, CheckCircle2, Clock, Save, DollarSign } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { formatLocalDateInputValue } from '@/utils/date';
import { useCompanyStore } from '@/store/useCompanyStore';

type Matricula = {
  id: string;
  anio_escolar: number;
  monto: number;
  estado: 'pendiente' | 'pagada';
  fecha_pago: string | null;
  notas: string | null;
};

interface PacienteMatriculaProps {
  pacienteId: string;
}

const ANIO_ACTUAL = new Date().getFullYear();

export function PacienteMatricula({ pacienteId }: PacienteMatriculaProps) {
  const supabase = useMemo(() => createClient(), []);
  const { activeCompany } = useCompanyStore();
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form para pagar matrícula
  const [fechaPago, setFechaPago] = useState(formatLocalDateInputValue());
  const [metodoPago, setMetodoPago] = useState('Efectivo');

  // Form para generar matrícula
  const [montoGenerar, setMontoGenerar] = useState('');

  useEffect(() => {
    if (!activeCompany) return;
    supabase.from('company_settings').select('monto_matricula').eq('company_id', activeCompany.id).single()
      .then(({data}) => {
        if (data && data.monto_matricula) {
          setMontoGenerar(String(data.monto_matricula));
        }
      });
  }, [supabase, activeCompany]);

  const fetchMatriculas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matriculas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('anio_escolar', { ascending: false });
    if (data) setMatriculas(data as Matricula[]);
    setLoading(false);
  }, [supabase, pacienteId]);

  useEffect(() => { fetchMatriculas(); }, [fetchMatriculas]);

  const matriculaActual = matriculas.find(m => m.anio_escolar === ANIO_ACTUAL);

  const handlePagarMatricula = async () => {
    if (!matriculaActual || !activeCompany) return;
    if (!confirm(`¿Confirmar pago de matrícula ${ANIO_ACTUAL}?`)) return;
    setSaving(true);

    // 1. Actualizar matrícula
    await supabase.from('matriculas').update({
      estado: 'pagada',
      fecha_pago: fechaPago,
      notas: metodoPago,
    }).eq('id', matriculaActual.id);

    // 2. Buscar/crear categoría "Matrículas"
    const { data: catData } = await supabase
      .from('categorias')
      .select('id')
      .eq('nombre', 'Matrículas')
      .eq('tipo', 'ingreso')
      .eq('company_id', activeCompany.id)
      .limit(1);

    let catId = catData?.[0]?.id;
    if (!catId) {
      const { data: newCat } = await supabase.from('categorias').insert([{
        nombre: 'Matrículas', tipo: 'ingreso', company_id: activeCompany.id
      }]).select().single();
      catId = newCat?.id;
    }

    // 3. Crear transacción de ingreso
    if (catId) {
      await supabase.from('transacciones').insert([{
        tipo: 'ingreso',
        monto_hnl: matriculaActual.monto,
        fecha: fechaPago,
        descripcion: `Matrícula ${ANIO_ACTUAL} - Paciente`,
        categoria_id: catId,
        metodo_pago: metodoPago,
        estado: 'pagado',
        paciente_id: pacienteId,
        company_id: activeCompany.id,
      }]);
    }

    fetchMatriculas();
    setSaving(false);
  };

  const handleGenerarMatricula = async () => {
    if (!activeCompany) return;

    const monto = parseFloat(montoGenerar) || 0;

    setSaving(true);
    const { error } = await supabase.from('matriculas').insert([{
      paciente_id: pacienteId,
      company_id: activeCompany.id,
      anio_escolar: ANIO_ACTUAL,
      monto,
      estado: 'pendiente',
    }]);
    if (error) alert(error.message);
    else fetchMatriculas();
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="space-y-5">

      {/* Matrícula del año actual */}
      <div className={`rounded-xl border p-4 ${
        matriculaActual?.estado === 'pagada'
          ? 'bg-green-50 dark:bg-emerald-950/20 border-green-200 dark:border-emerald-900/30'
          : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={16} className="text-brand-500" />
            Matrícula {ANIO_ACTUAL}
          </h4>
          {matriculaActual ? (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              matriculaActual.estado === 'pagada'
                ? 'bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400'
                : 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400'
            }`}>
              {matriculaActual.estado === 'pagada'
                ? <><CheckCircle2 size={12} /> Pagada</>
                : <><Clock size={12} /> Pendiente</>}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Sin matrícula</span>
          )}
        </div>

        {!matriculaActual ? (
          <div className="text-center py-2 space-y-4">
            <p className="text-sm text-slate-600">Este paciente no tiene matrícula para {ANIO_ACTUAL}.</p>
            
            <div className="max-w-[200px] mx-auto text-left">
              <label className="block text-xs font-medium text-slate-500 mb-1">Monto a Cobrar (L)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                value={montoGenerar}
                onChange={e => setMontoGenerar(e.target.value)}
                className="px-3 py-2 w-full rounded-lg border border-border bg-[#ffffff] dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20" 
                placeholder="Ej. 500.00"
              />
            </div>

            <button
              onClick={handleGenerarMatricula}
              disabled={saving || !montoGenerar}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
              Generar Matrícula {ANIO_ACTUAL}
            </button>
          </div>
        ) : matriculaActual.estado === 'pagada' ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-slate-500">Fecha de pago</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{matriculaActual.fecha_pago ? new Date(matriculaActual.fecha_pago + 'T00:00:00').toLocaleDateString('es-HN') : '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Monto pagado</p>
              <p className="font-bold text-green-700 dark:text-emerald-400 font-mono text-lg">L {matriculaActual.monto.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-1"><DollarSign size={14}/>Monto</span>
              <span className="font-bold text-orange-700 dark:text-orange-400 font-mono">L {matriculaActual.monto.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha de Pago</label>
                <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)}
                  className="px-3 py-1.5 w-full rounded-lg border border-border bg-[#ffffff] dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Método de Pago</label>
                <select 
                  value={metodoPago} 
                  onChange={e => setMetodoPago(e.target.value)}
                  className="px-3 py-1.5 w-full rounded-lg border border-border bg-[#f1f5f9] dark:bg-slate-800 focus:bg-[#ffffff] dark:focus:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-700 dark:text-slate-200"
                >
                  <option value="Efectivo" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">Efectivo</option>
                  <option value="Transferencia" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">Transferencia</option>
                  <option value="Tarjeta de Credito/Debito" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">Tarjeta de Crédito/Débito</option>
                  <option value="Cheque" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">Cheque</option>
                </select>
              </div>
            </div>
            <button
              onClick={handlePagarMatricula}
              disabled={saving}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Registrar Pago de Matrícula
            </button>
          </div>
        )}
      </div>

      {/* Historial de matrículas anteriores */}
      {matriculas.filter(m => m.anio_escolar !== ANIO_ACTUAL).length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historial de Matrículas</h4>
          <div className="space-y-2">
            {matriculas.filter(m => m.anio_escolar !== ANIO_ACTUAL).map(m => (
              <div key={m.id} className="flex items-center justify-between bg-[#ffffff] dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  {m.estado === 'pagada'
                    ? <CheckCircle2 size={16} className="text-green-500" />
                    : <Clock size={16} className="text-slate-400" />}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Año {m.anio_escolar}</p>
                    {m.fecha_pago && <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(m.fecha_pago + 'T00:00:00').toLocaleDateString('es-HN')}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-600 dark:text-slate-200">L {m.monto.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold uppercase ${m.estado === 'pagada' ? 'text-green-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {m.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
