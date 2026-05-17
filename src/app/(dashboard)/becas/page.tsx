'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, ShieldCheck, Loader2, Percent, DollarSign, CalendarRange, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { parseDateOnly } from '@/utils/date';
import { useCompanyStore } from '@/store/useCompanyStore';
import { TablePagination } from '@/components/ui/TablePagination';

type Beca = {
  id: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  activa: boolean;
  pacientes: { nombre_completo: string | null; codigo_interno: string | null } | null;
};

export default function BecasPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeCompany } = useCompanyStore();
  const [becas, setBecas] = useState<Beca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActiva, setFilterActiva] = useState<'todas' | 'activas' | 'inactivas'>('todas');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchBecas = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    const { data } = await supabase
      .from('becas')
      .select('*, pacientes(nombre_completo, codigo_interno)')
      .eq('company_id', activeCompany.id)
      .order('fecha_inicio', { ascending: false })
      .returns<Beca[]>();
    if (data) setBecas(data);
    setLoading(false);
  }, [supabase, activeCompany]);

  useEffect(() => { fetchBecas(); }, [fetchBecas]);

  const filteredBecas = useMemo(() => becas.filter(b => {
    const needle = searchTerm.toLowerCase();
    const matchSearch =
      (b.pacientes?.nombre_completo ?? '').toLowerCase().includes(needle) ||
      (b.pacientes?.codigo_interno ?? '').toLowerCase().includes(needle) ||
      (b.motivo ?? '').toLowerCase().includes(needle);

    const matchActiva =
      filterActiva === 'todas' ? true :
      filterActiva === 'activas' ? b.activa :
      !b.activa;

    return matchSearch && matchActiva;
  }), [becas, searchTerm, filterActiva]);

  // Resetear a página 1 al filtrar
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterActiva]);

  const paginatedBecas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBecas.slice(start, start + pageSize);
  }, [filteredBecas, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-surface p-4 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por expediente o paciente..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setFilterActiva('todas')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${filterActiva === 'todas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todas</button>
            <button onClick={() => setFilterActiva('activas')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${filterActiva === 'activas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Activas</button>
            <button onClick={() => setFilterActiva('inactivas')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${filterActiva === 'inactivas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Inactivas</button>
          </div>
        </div>

        <button className="flex items-center justify-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm shrink-0">
          <Plus size={18} />
          <span>Otorgar Beca</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-semibold">Paciente</th>
              <th className="p-4 font-semibold">Tipo de Beca</th>
              <th className="p-4 font-semibold text-right">Valor</th>
              <th className="p-4 font-semibold text-center">Vigencia</th>
              <th className="p-4 font-semibold text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3 text-brand-500" />
                  Cargando becas...
                </td>
              </tr>
            ) : filteredBecas.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500">
                  <ShieldCheck size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium text-slate-700">No hay becas registradas</p>
                  <p className="text-sm">Otorga una beca a un paciente para comenzar.</p>
                </td>
              </tr>
            ) : (
              paginatedBecas.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <User size={14} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{b.pacientes?.nombre_completo || 'Paciente no encontrado'}</p>
                        <p className="text-xs text-slate-400 font-mono">{b.pacientes?.codigo_interno}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">
                    <div className="flex items-center gap-1.5">
                      {b.tipo === 'porcentaje' ? <Percent size={14} className="text-brand-500" /> : <DollarSign size={14} className="text-brand-500" />}
                      {b.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                    </div>
                    {b.motivo && <p className="text-xs text-slate-400 mt-0.5">{b.motivo}</p>}
                  </td>
                  <td className="p-4 text-right font-bold text-brand-600">
                    {b.tipo === 'porcentaje' ? `${b.valor}%` : `L ${b.valor.toFixed(2)}`}
                  </td>
                  <td className="p-4 text-center text-slate-500 text-xs">
                    <div className="flex items-center justify-center gap-1">
                      <CalendarRange size={13} />
                      <span>
                        {parseDateOnly(b.fecha_inicio).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' — '}
                        {parseDateOnly(b.fecha_fin).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {b.activa ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                        <ShieldCheck size={12} className="mr-1" /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                        Inactiva
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination
          totalItems={filteredBecas.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
