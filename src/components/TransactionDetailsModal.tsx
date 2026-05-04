import { X, Calendar, FileText, Tag, CreditCard, CheckCircle2, Clock, Trash2, Edit2, Loader2, Ban } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { parseDateOnly } from '@/utils/date';

type Transaccion = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto_hnl: number;
  monto_usd: number | null;
  fecha: string;
  descripcion: string;
  categoria_id: string;
  anulado: boolean | null;
  categorias: { nombre: string | null } | null;
  metodo_pago: string;
  numero_recibo: string | null;
  comprobante_url: string | null;
  estado: string;
};

export function TransactionDetailsModal({ 
  transaction, 
  onClose,
  onUpdate,
  onEdit
}: { 
  transaction: Transaccion; 
  onClose: () => void;
  onUpdate: () => void;
  onEdit: (t: Transaccion) => void;
}) {
  const [isAnulando, setIsAnulando] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  if (!transaction) return null;

  const isIngreso = transaction.tipo === 'ingreso';
  const isAnulado = transaction.anulado === true;

  const handleAnular = async () => {
    if (!confirm('¿Estás seguro de que deseas anular esta transacción? Esto es irreversible.')) return;
    
    setIsAnulando(true);
    
    // Trigger a session refresh if needed (and keeps auth consistent for RLS).
    await supabase.auth.getUser();

    // 1. Guardar en auditoría
    const { error: auditError } = await supabase.from('auditoria').insert([{
      tabla: 'transacciones',
      registro_id: transaction.id,
      campo: 'anulado',
      valor_anterior: 'false',
      valor_nuevo: 'true'
      // Omitimos usuario_id por ahora para evitar el error de Foreign Key si public.users está vacía
    }]);

    if (auditError) {
      console.error("Error auditoria:", auditError);
      alert(`Falló el guardado de auditoría: ${auditError.message}`);
    }

    // 2. Anular la transacción (solo actualizando la columna booleana 'anulado')
    const { error } = await supabase
      .from('transacciones')
      .update({ anulado: true })
      .eq('id', transaction.id);

    setIsAnulando(false);
    
    if (!error) {
      onUpdate();
      onClose();
    } else {
      alert(`Error anulando: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-5 flex justify-between items-start ${isAnulado ? 'bg-slate-500' : isIngreso ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="text-white">
            <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1 flex items-center gap-2">
              {isAnulado && <Ban size={14} />}
              {isAnulado ? 'Transacción Anulada' : isIngreso ? 'Recibo de Ingreso' : 'Comprobante de Egreso'}
            </p>
            <h2 className={`text-3xl font-bold ${isAnulado ? 'line-through opacity-70' : ''}`}>
              {transaction.monto_usd ? `$ ${transaction.monto_usd.toFixed(2)}` : `L ${transaction.monto_hnl.toFixed(2)}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          <div>
            <h3 className={`text-lg font-semibold ${isAnulado ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {transaction.descripcion}
            </h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 capitalize">
              <Calendar size={14} />
              {parseDateOnly(transaction.fecha).toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Tag size={12} /> Categoría</p>
              <p className="text-sm font-medium text-slate-700">{transaction.categorias?.nombre || 'Sin categoría'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><CreditCard size={12} /> Método de Pago</p>
              <p className="text-sm font-medium text-slate-700 capitalize">{transaction.metodo_pago}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 flex items-center gap-2"><FileText size={16} /> Documento Nº</span>
              <span className="text-sm font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{transaction.numero_recibo || 'N/A'}</span>
            </div>
            
            {transaction.comprobante_url && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-slate-500 flex items-center gap-2">Comprobante</span>
                <a 
                  href={transaction.comprobante_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  Ver Archivo
                </a>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-slate-500 flex items-center gap-2">
                {isAnulado ? <Ban size={16} className="text-slate-500"/> : transaction.estado === 'pagado' ? <CheckCircle2 size={16} className="text-green-500"/> : <Clock size={16} className="text-orange-500"/>}
                Estado
              </span>
              <span className={`text-sm font-semibold capitalize px-2 py-0.5 rounded-full ${isAnulado ? 'bg-slate-100 text-slate-600' : transaction.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {transaction.estado}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-slate-50 flex justify-between items-center">
          <div className="flex gap-2">
            {!isAnulado && (
              <>
                <button 
                  onClick={() => { onClose(); onEdit(transaction); }}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button 
                  onClick={handleAnular}
                  disabled={isAnulando}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnulando ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />} 
                  Anular
                </button>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
