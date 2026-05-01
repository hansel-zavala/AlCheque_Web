'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, FileDown, Search, Loader2 } from 'lucide-react';
import { TransactionForm } from '@/components/TransactionForm';
import { createClient } from '@/utils/supabase/client';

export default function TransaccionesPage() {
  const [modalType, setModalType] = useState<'ingreso' | 'egreso' | null>(null);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchTransacciones(); // Recargar datos sin refrescar la página
  };

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

      {/* Tabla de Transacciones */}
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-medium w-32">Fecha</th>
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
            ) : transacciones.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No hay transacciones registradas. ¡Crea la primera!
                </td>
              </tr>
            ) : (
              transacciones.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
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
                  <td className={`p-4 text-right font-medium ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'} 
                    {t.monto_usd ? `$ ${t.monto_usd.toFixed(2)}` : `L ${t.monto_hnl.toFixed(2)}`}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      t.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {t.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal condicional para registrar transacciones */}
      {modalType && (
        <TransactionForm 
          type={modalType} 
          onClose={handleTransactionSaved} 
        />
      )}
    </div>
  );
}
