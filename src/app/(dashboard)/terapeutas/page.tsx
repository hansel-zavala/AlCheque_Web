'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, UserPlus, Loader2, Users, Stethoscope, DollarSign, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCompanyStore } from '@/store/useCompanyStore';
import dynamic from 'next/dynamic';

const TerapeutaDrawer = dynamic(
  () => import('@/components/TerapeutaDrawer').then((m) => m.TerapeutaDrawer),
  { ssr: false }
);

type Terapeuta = {
  id: string;
  nombre: string;
  puesto: string;
  salario_mensual: number;
  telefono: string | null;
  email: string | null;
  activo: boolean;
};

type ResumenMes = {
  terapeuta_id: string;
  estado: string;
  monto_pagado: number;
  monto_total: number;
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function TerapeutasPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeCompany } = useCompanyStore();
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [resumenes, setResumenes] = useState<ResumenMes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const now = new Date();
  const mesActual = now.getMonth() + 1;
  const anioActual = now.getFullYear();

  const fetchData = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);

    const [{ data: t }, { data: r }] = await Promise.all([
      supabase.from('terapeutas').select('*').eq('company_id', activeCompany.id).order('nombre'),
      supabase.from('pagos_salario').select('terapeuta_id, estado, monto_pagado, monto_total')
        .eq('company_id', activeCompany.id).eq('mes', mesActual).eq('anio', anioActual),
    ]);

    if (t) setTerapeutas(t as Terapeuta[]);
    if (r) setResumenes(r as ResumenMes[]);
    setLoading(false);
  }, [supabase, activeCompany, mesActual, anioActual]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = terapeutas.filter(t =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.puesto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getResumen = (id: string) => resumenes.find(r => r.terapeuta_id === id);

  const totalNomina = terapeutas.filter(t => t.activo).reduce((s, t) => s + t.salario_mensual, 0);
  const totalPagado = resumenes.reduce((s, r) => s + r.monto_pagado, 0);
  const totalPendiente = totalNomina - totalPagado;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: `Nómina ${MESES[mesActual-1]}`, value: `L ${totalNomina.toFixed(2)}`, color: 'slate', icon: <Users size={18}/> },
          { label: 'Total Pagado', value: `L ${totalPagado.toFixed(2)}`, color: 'green', icon: <CheckCircle2 size={18}/> },
          { label: 'Saldo Pendiente', value: `L ${totalPendiente.toFixed(2)}`, color: 'orange', icon: <AlertCircle size={18}/> },
        ].map(kpi => (
          <div key={kpi.label} className="bg-surface border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${kpi.color}-100 text-${kpi.color}-600 shrink-0`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className="text-lg font-bold text-slate-800 font-mono">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface p-4 rounded-xl shadow-sm border border-border gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar terapeuta o puesto..."
            className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all shadow-inner"
          />
        </div>
        <button
          onClick={() => { setSelectedId(null); setIsDrawerOpen(true); }}
          className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
        >
          <UserPlus size={18} />
          <span className="font-medium">Nuevo Terapeuta</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-semibold">Terapeuta</th>
              <th className="p-4 font-semibold">Puesto</th>
              <th className="p-4 font-semibold text-right">Salario Mensual</th>
              <th className="p-4 font-semibold text-center">Estado {MESES[mesActual-1]}</th>
              <th className="p-4 font-semibold text-right w-24">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-12 text-center text-slate-400">
                <Loader2 size={28} className="animate-spin mx-auto mb-3 text-brand-500" />
                Cargando terapeutas...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-slate-500">
                <Stethoscope size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-lg font-medium text-slate-700">No hay terapeutas registrados</p>
                <p className="text-sm">Agrega el primer terapeuta para comenzar.</p>
              </td></tr>
            ) : (
              filtered.map(t => {
                const res = getResumen(t.id);
                const saldo = t.salario_mensual - (res?.monto_pagado ?? 0);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => { setSelectedId(t.id); setIsDrawerOpen(true); }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                          <span className="text-brand-700 font-bold text-sm">{t.nombre.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{t.nombre}</p>
                          {t.email && <p className="text-xs text-slate-400">{t.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{t.puesto}</td>
                    <td className="p-4 text-right font-mono font-semibold text-slate-800">
                      L {t.salario_mensual.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      {!res ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          <Clock size={12}/> Sin registro
                        </span>
                      ) : res.estado === 'pagado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle2 size={12}/> Pagado
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <DollarSign size={12}/> {res.estado === 'parcial' ? 'Parcial' : 'Pendiente'}
                          </span>
                          {saldo > 0 && <p className="text-[10px] text-slate-400 font-mono">Saldo: L {saldo.toFixed(2)}</p>}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-colors ml-auto" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TerapeutaDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        terapeutaId={selectedId}
        onSuccess={fetchData}
      />
    </div>
  );
}
