'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { formatLocalDateInputValue } from '@/utils/date';

type Categoria = { id: string; nombre: string };

type TransaccionEditable = {
  id: string;
  monto_hnl: number;
  monto_usd: number | null;
  fecha: string;
  categoria_id: string;
  metodo_pago: string;
  descripcion: string;
  numero_recibo: string | null;
  comprobante_url: string | null;
};

interface TransactionFormProps {
  type: 'ingreso' | 'egreso';
  onClose: () => void;
  onSuccess: () => void;
  initialData?: TransaccionEditable | null;
}

export function TransactionForm({ type, onClose, onSuccess, initialData }: TransactionFormProps) {
  const isIngreso = type === 'ingreso';
  const supabase = useMemo(() => createClient(), []);
  
  // States
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCats, setFetchingCats] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form values
  const [monto, setMonto] = useState(initialData ? (initialData.monto_usd ? initialData.monto_usd.toString() : initialData.monto_hnl.toString()) : '');
  const [enUsd, setEnUsd] = useState(initialData ? !!initialData.monto_usd : false);
  const [fecha, setFecha] = useState(initialData ? initialData.fecha : formatLocalDateInputValue());
  const [categoriaId, setCategoriaId] = useState(initialData ? initialData.categoria_id : '');
  const [metodoPago, setMetodoPago] = useState(initialData ? initialData.metodo_pago : 'efectivo');
  const [descripcion, setDescripcion] = useState(initialData ? initialData.descripcion : '');
  const [numeroRecibo, setNumeroRecibo] = useState(initialData ? (initialData.numero_recibo || '') : '');
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('tipo', type)
        .eq('activa', true)
        .returns<Categoria[]>();
      
      if (error) {
        setErrorMsg('Error DB: ' + error.message);
      } else if (data) {
        setCategorias(data);
        if (data.length === 0) {
          setErrorMsg(`No se encontraron categorías de tipo "${type}". Por favor agrégalas en Configuración o verifica tu inicio de sesión.`);
        }
      }
      setFetchingCats(false);
    }
    loadCategories();
  }, [type, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!categoriaId) {
      setErrorMsg('Debes seleccionar una categoría. Si no hay, créala en Configuración.');
      setLoading(false);
      return;
    }

    let comprobante_url = initialData?.comprobante_url || null;

    if (comprobanteFile) {
      const fileExt = comprobanteFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `transacciones/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(filePath, comprobanteFile);

      if (uploadError) {
        setErrorMsg('Error subiendo comprobante. Verifica que el bucket "comprobantes" exista en Supabase. Detalles: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('comprobantes')
        .getPublicUrl(filePath);

      comprobante_url = publicUrlData.publicUrl;
    }

    const payload = {
      tipo: type,
      monto_hnl: enUsd ? 0 : parseFloat(monto), // Lógica simplificada
      monto_usd: enUsd ? parseFloat(monto) : null,
      fecha,
      categoria_id: categoriaId,
      metodo_pago: metodoPago,
      descripcion,
      numero_recibo: numeroRecibo || null,
      comprobante_url,
      estado: 'pagado', 
    };

    let errorResult;

    if (initialData) {
      // ACTUALIZAR (UPDATE)
      const { error: updateError } = await supabase.from('transacciones').update(payload).eq('id', initialData.id);
      errorResult = updateError;
      
      // Guardar auditoría si fue exitoso
      if (!updateError) {
        const { error: auditError } = await supabase.from('auditoria').insert([{
          tabla: 'transacciones',
          registro_id: initialData.id,
          campo: 'edicion_completa',
          valor_anterior: JSON.stringify(initialData),
          valor_nuevo: JSON.stringify(payload)
          // Omitimos usuario_id temporalmente
        }]);
        
        if (auditError) {
          console.error("Error guardando auditoria de edición:", auditError);
          alert(`La transacción se actualizó, pero falló la auditoría: ${auditError.message}`);
        }
      }
    } else {
      // CREAR (INSERT)
      const { error: insertError } = await supabase.from('transacciones').insert([payload]);
      errorResult = insertError;
    }

    setLoading(false);

    if (errorResult) {
      console.error(errorResult);
      setErrorMsg(errorResult.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-border flex justify-between items-center ${isIngreso ? 'bg-green-50' : 'bg-red-50'}`}>
          <h2 className={`text-xl font-bold ${isIngreso ? 'text-green-700' : 'text-red-700'}`}>
            {initialData ? 'Editar' : 'Registrar Nuevo'} {isIngreso ? 'Ingreso' : 'Egreso'}
          </h2>
          <button onClick={onClose} type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Row 1: Monto y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto (HNL) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">L</span>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="pl-8 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              <div className="mt-2 flex items-center">
                <input 
                  type="checkbox" 
                  id="moneda_usd" 
                  checked={enUsd}
                  onChange={(e) => setEnUsd(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 border-slate-300 mr-2" 
                />
                <label htmlFor="moneda_usd" className="text-xs text-slate-500">¿Recibido en Dólares (USD)?</label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Transacción *</label>
              <input 
                type="date" 
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="px-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
              />
            </div>
          </div>

          {/* Row 2: Categoría y Método */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
              <select 
                required 
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="px-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
              >
                <option value="">Selecciona una categoría...</option>
                {fetchingCats ? (
                  <option disabled>Cargando categorías...</option>
                ) : (
                  categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago *</label>
              <select 
                required 
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="px-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta de Débito/Crédito</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Paciente y Recibo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de la Transacción *</label>
              <input 
                type="text" 
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle de la transacción..."
                className="px-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isIngreso ? 'Número de Recibo (Opcional)' : 'Número de Factura Externa'}
              </label>
              <input 
                type="text" 
                value={numeroRecibo}
                onChange={(e) => setNumeroRecibo(e.target.value)}
                placeholder={isIngreso ? "00145" : "000-001-01-00045678"}
                className="px-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono text-sm"
              />
            </div>
          </div>

          {/* Upload Comprobante */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Comprobante Adjunto (Opcional)</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group">
              <input 
                type="file" 
                accept="image/png, image/jpeg, application/pdf"
                onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud size={32} className={`${comprobanteFile ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-500'} mb-2`} />
              <p className="text-sm font-medium text-slate-600">
                {comprobanteFile ? comprobanteFile.name : 'Haz clic para subir un comprobante'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, o PDF (Max. 5MB)</p>
            </div>
            {initialData?.comprobante_url && !comprobanteFile && (
              <p className="text-xs text-green-600 mt-2 font-medium">✓ Esta transacción ya tiene un comprobante guardado.</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex justify-end space-x-3 mt-8">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200/50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`flex items-center px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-colors disabled:opacity-50 ${
                isIngreso ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading && <Loader2 className="animate-spin mr-2" size={18} />}
              {loading ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
