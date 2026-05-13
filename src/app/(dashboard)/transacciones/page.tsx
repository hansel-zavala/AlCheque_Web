'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, MinusCircle, FileDown, Search, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { parseDateOnly } from '@/utils/date';
import { useCompanyStore } from '@/store/useCompanyStore';

const TransactionForm = dynamic(
  () => import('@/components/TransactionForm').then((m) => m.TransactionForm),
  { ssr: false }
);

const TransactionDetailsModal = dynamic(
  () => import('@/components/TransactionDetailsModal').then((m) => m.TransactionDetailsModal),
  { ssr: false }
);

type Transaccion = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  fecha: string;
  descripcion: string;
  metodo_pago: string;
  estado: string;
  categoria_id: string;
  anulado: boolean | null;
  numero_recibo: string | null;
  monto_hnl: number;
  monto_usd: number | null;
  comprobante_url: string | null;
  categorias: { nombre: string | null } | null;
};

export default function TransaccionesPage() {
  const [modalType, setModalType] = useState<'ingreso' | 'egreso' | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaccion | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaccion | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'ingresos' | 'egresos' | 'anulados'>('todos');
  
  // Nuevos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'todos' | 'semana' | 'mes' | 'año'>('todos');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [pacienteFilter, setPacienteFilter] = useState<string>('todos');
  const [pacientes, setPacientes] = useState<{id: string; nombre_completo: string | null}[]>([]);

  const supabase = useMemo(() => createClient(), []);
  const { activeCompany } = useCompanyStore();

  const fetchTransacciones = useCallback(async () => {
    if (!activeCompany) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        categorias (
          nombre
        )
      `)
      .eq('company_id', activeCompany.id)
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
    } else if (data) {
      setTransacciones(data);
    }
    
    // Cargar pacientes para el filtro
    const { data: pData } = await supabase.from('pacientes').select('id, nombre_completo').eq('company_id', activeCompany.id);
    if (pData) setPacientes(pData);

    setLoading(false);
  }, [supabase, activeCompany]);

  useEffect(() => {
    fetchTransacciones();
  }, [fetchTransacciones]);

  const handleTransactionSaved = () => {
    setModalType(null);
    setEditingTransaction(null);
    fetchTransacciones(); // Recargar datos sin refrescar la página
  };

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(transacciones.map(t => t.categorias?.nombre).filter(Boolean))) as string[];
  }, [transacciones]);

  // Filtrado y ordenamiento en cliente
  const filteredTransacciones = transacciones.filter(t => {
    // 1. Filtro base de Pestañas
    if (filter === 'ingresos' && (t.tipo !== 'ingreso' || t.anulado)) return false;
    if (filter === 'egresos' && (t.tipo !== 'egreso' || t.anulado)) return false;
    if (filter === 'anulados' && !t.anulado) return false;

    // 2. Filtro de Búsqueda de Texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const descMatch = t.descripcion?.toLowerCase().includes(searchLower) || false;
      const recMatch = t.numero_recibo?.toLowerCase().includes(searchLower) || false;
      if (!descMatch && !recMatch) return false;
    }

    // 3. Filtro de Tiempo
    if (timeFilter !== 'todos') {
      const tDate = parseDateOnly(t.fecha);
      const now = new Date();
      let isIncluded = false;
      
      const firstDayOfWeek = new Date(now);
      const day = firstDayOfWeek.getDay();
      const diff = firstDayOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      firstDayOfWeek.setDate(diff);
      firstDayOfWeek.setHours(0,0,0,0);
      
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

      if (timeFilter === 'semana') isIncluded = tDate >= firstDayOfWeek;
      else if (timeFilter === 'mes') isIncluded = tDate >= firstDayOfMonth;
      else if (timeFilter === 'año') isIncluded = tDate >= firstDayOfYear;

      if (!isIncluded) return false;
    }

    // 4. Filtro de Categoría
    if (categoryFilter !== 'todas' && t.categorias?.nombre !== categoryFilter) return false;

    // 5. Filtro de Paciente (buscando nombre en la descripción)
    if (pacienteFilter !== 'todos') {
      const p = pacientes.find(px => px.id === pacienteFilter);
      if (p && p.nombre_completo && !t.descripcion?.includes(p.nombre_completo)) return false;
    }

    return true;
  }).sort((a, b) => {
    // Siempre agrupar los anulados al final si estamos en "Todos"
    if (filter === 'todos') {
      if (a.anulado && !b.anulado) return 1;
      if (!a.anulado && b.anulado) return -1;
    }
    
    // Ordenar por fecha
    const dateA = new Date(a.fecha).getTime();
    const dateB = new Date(b.fecha).getTime();
    
    if (sortOrder === 'desc') return dateB - dateA;
    return dateA - dateB;
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl shadow-sm border border-border">
        <div className="flex space-x-2 w-full sm:w-auto">
          <button onClick={() => setModalType('ingreso')} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
            <PlusCircle size={18} />
            <span>Registrar Ingreso</span>
          </button>
          <button onClick={() => setModalType('egreso')} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
            <MinusCircle size={18} />
            <span>Registrar Egreso</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descripción o recibo..." 
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-surface p-4 rounded-xl shadow-sm border border-border flex flex-wrap gap-4 items-end mb-4">
        <div className="flex flex-col min-w-[140px]">
          <label className="text-xs font-semibold text-slate-500 mb-1">Periodo</label>
          <select value={timeFilter} onChange={e=>setTimeFilter(e.target.value as any)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20">
            <option value="todos">Todos los tiempos</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="año">Este Año</option>
          </select>
        </div>

        <div className="flex flex-col min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 mb-1">Orden de Fecha</label>
          <select value={sortOrder} onChange={e=>setSortOrder(e.target.value as any)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20">
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguas primero</option>
          </select>
        </div>

        <div className="flex flex-col min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 mb-1">Categoría</label>
          <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20">
            <option value="todas">Todas</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col min-w-[160px] flex-1">
          <label className="text-xs font-semibold text-slate-500 mb-1">Paciente Asignado</label>
          <select value={pacienteFilter} onChange={e=>setPacienteFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 w-full">
            <option value="todos">Cualquiera</option>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
          </select>
        </div>
      </div>

      {/* Botones de filtro por estados */}
      <div className="flex space-x-2 bg-surface p-2 rounded-xl shadow-sm border border-border overflow-x-auto w-full md:w-fit mb-6">
        <button 
          onClick={() => setFilter('todos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('ingresos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'ingresos' ? 'bg-green-100 text-green-800' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Ingresos
        </button>
        <button 
          onClick={() => setFilter('egresos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'egresos' ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Egresos
        </button>
        <button 
          onClick={() => setFilter('anulados')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'anulados' ? 'bg-slate-200 text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Anulados
        </button>
      </div>

      {/* Tabla de Transacciones */}
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-medium w-40">Fecha</th>
              <th className="p-4 font-medium">Descripción</th>
              <th className="p-4 font-medium w-48">Categoría</th>
              <th className="p-4 font-medium w-24">Recibo</th>
              <th className="p-4 font-medium w-32 text-right">Monto</th>
              <th className="p-4 font-medium w-24 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <Loader2 className="animate-spin inline-block mr-2" size={20} />
                  Cargando transacciones...
                </td>
              </tr>
            ) : filteredTransacciones.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No hay transacciones registradas para este filtro.
                </td>
              </tr>
            ) : (
              filteredTransacciones.map((t) => (
                <tr 
                  key={t.id} 
                  onClick={() => setSelectedTransaction(t)}
                  className={`transition-colors group cursor-pointer ${t.anulado ? 'bg-slate-50 opacity-70 hover:opacity-100' : 'hover:bg-slate-50'}`}
                >
                  <td className="p-4 text-sm text-slate-600">
                    {parseDateOnly(t.fecha).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {t.descripcion}
                    <div className="text-xs text-slate-400 font-normal mt-0.5 capitalize">{t.metodo_pago}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {t.categorias?.nombre || 'Sin categoría'}
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-mono">
                    {t.numero_recibo || '--'}
                  </td>
                  <td className={`p-4 text-right font-medium ${t.anulado ? 'text-slate-500 line-through' : t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'} 
                    {t.monto_usd ? `$ ${t.monto_usd.toFixed(2)}` : `L ${t.monto_hnl.toFixed(2)}`}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      t.anulado ? 'bg-slate-200 text-slate-600' :
                      t.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {t.anulado ? 'Anulado' : t.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal condicional para registrar o editar transacciones */}
      {modalType && (
        <TransactionForm 
          type={modalType} 
          initialData={editingTransaction}
          onClose={() => { setModalType(null); setEditingTransaction(null); }}
          onSuccess={handleTransactionSaved}
        />
      )}

      {/* Modal condicional para ver detalles de la transacción */}
      {selectedTransaction && (
        <TransactionDetailsModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
          onUpdate={() => { setSelectedTransaction(null); fetchTransacciones(); }}
          onEdit={(t) => {
            setSelectedTransaction(null);
            setEditingTransaction(t);
            setModalType(t.tipo);
          }}
        />
      )}
    </div>
  );
}
