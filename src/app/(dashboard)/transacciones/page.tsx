'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, FileDown, Search, Loader2 } from 'lucide-react';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';
import { createClient } from '@/utils/supabase/client';

export default function TransaccionesPage() {
  const [modalType, setModalType] = useState<'ingreso' | 'egreso' | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'ingresos' | 'egresos' | 'anulados'>('todos');
  const supabase = createClient();

  useEffect(() => {
    fetchTransacciones();
  }, []);

  const fetchTransacciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        categorias (
          nombre
        )
      `)
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
    } else if (data) {
      setTransacciones(data);
    }
    setLoading(false);
  };

  const handleTransactionSaved = () => {
    setModalType(null);
    setEditingTransaction(null);
    fetchTransacciones(); // Recargar datos sin refrescar la página
  };

  // Filtrado y ordenamiento en cliente
  const filteredTransacciones = transacciones.filter(t => {
    if (filter === 'ingresos') return t.tipo === 'ingreso' && !t.anulado;
    if (filter === 'egresos') return t.tipo === 'egreso' && !t.anulado;
    if (filter === 'anulados') return t.anulado === true;
    return true; // todos
  }).sort((a, b) => {
    if (filter === 'todos') {
      // Si uno está anulado y el otro no, el anulado va al final
      if (a.anulado && !b.anulado) return 1;
      if (!a.anulado && b.anulado) return -1;
    }
    // Si no, mantener el orden de fecha descendente que ya viene
    return 0;
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
              placeholder="Buscar por descripción o recibo..." 
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-lg border border-border transition-colors">
            <FileDown size={20} />
          </button>
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
                    {new Date(t.fecha).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
