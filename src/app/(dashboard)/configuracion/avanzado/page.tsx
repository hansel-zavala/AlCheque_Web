'use client';

import { useState, useMemo } from 'react';
import { TriangleAlert, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCompanyStore } from '@/store/useCompanyStore';

export default function AvanzadoPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeCompany } = useCompanyStore();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleWipeData = async () => {
    if (!activeCompany) return;
    if (confirmText !== 'ELIMINAR TODO') return;

    if (!confirm('¿Estás COMPLETAMENTE seguro de querer borrar toda la información? Esta acción es irreversible y borrará pacientes, transacciones, cuentas y catálogos.')) {
      return;
    }

    setLoading(true);
    setIsWiping(true);
    setSuccessMsg('');

    try {
      const { error } = await supabase.rpc('limpiar_datos_empresa', { p_company_id: activeCompany.id });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuccessMsg('¡Todos los datos han sido borrados con éxito! La cuenta está en cero.');
      setConfirmText('');
    } catch (err: any) {
      alert(`Error al borrar los datos: ${err.message}`);
    } finally {
      setLoading(false);
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Opciones Avanzadas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ajustes críticos y acciones destructivas.
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <ShieldAlert size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-900 mb-2">Zona de Peligro: Restablecimiento de Fábrica</h2>
            <p className="text-sm text-red-700 mb-4">
              Esta acción eliminará <strong>TODO</strong> el contenido asociado a esta empresa. 
              Esto incluye: pacientes, terapeutas, transacciones, ingresos, egresos, cuentas por cobrar, catálogos y matrículas. 
              <strong> Esta acción no se puede deshacer.</strong>
            </p>
            
            <div className="bg-white p-4 rounded-xl border border-red-200 space-y-4">
              <p className="text-sm text-slate-700 font-medium">
                Para confirmar, escribe <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-red-600 font-bold">ELIMINAR TODO</span> a continuación:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR TODO"
                className="w-full px-4 py-2 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-red-50/30 text-sm font-mono text-center"
              />
              
              <button
                onClick={handleWipeData}
                disabled={loading || confirmText !== 'ELIMINAR TODO'}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Borrando datos...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Borrar Todos los Datos de la Cuenta
                  </>
                )}
              </button>
            </div>
            
            {successMsg && (
              <div className="mt-4 p-4 bg-green-100 border border-green-200 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                ✅ {successMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
