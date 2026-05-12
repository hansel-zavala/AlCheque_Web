'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, AlertCircle, CheckCircle, HandCoins, Plus, Loader2, CalendarClock, Receipt, Tag } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import { formatLocalDateInputValue, parseDateOnly } from '@/utils/date';
import { useCompanyStore } from '@/store/useCompanyStore';

const CuentaModal = dynamic(
  () => import('@/components/CuentaModal').then((m) => m.CuentaModal),
  { ssr: false }
);

const AbonoModal = dynamic(
  () => import('@/components/AbonoModal').then((m) => m.AbonoModal),
  { ssr: false }
);

type Cuenta = {
  id: string;
  monto_total: string;
  monto_pagado: string;
  fecha_vencimiento: string;
  estado: string;
  estadoCalculado?: string;
  descuento_valor: number | null;
  notas?: string | null;
  pacientes: { nombre_completo: string | null; codigo_interno: string | null } | null;
  servicios: { nombre: string | null } | null;
};

type CuentaRow = Omit<Cuenta, 'estadoCalculado'>;

export default function CuentasPage() {
  const supabase = useMemo(() => createClient(), []);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'vencidas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<Cuenta | null>(null);
  const { activeCompany } = useCompanyStore();

  const fetchCuentas = useCallback(async () => {
    if (!activeCompany) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('cuentas_por_cobrar')
      .select(`
        *,
        pacientes(nombre_completo, codigo_interno),
        servicios(nombre)
      `)
      .eq('company_id', activeCompany.id)
      .order('fecha_vencimiento', { ascending: true })
      .returns<CuentaRow[]>();

    if (data) {
      // Determinar si están vencidas basado en la fecha
      const today = formatLocalDateInputValue();
      const procesadas = data.map(c => {
        let estadoCalculado = c.estado;
        if (c.estado !== 'pagada' && c.fecha_vencimiento < today) {
          estadoCalculado = 'vencida';
        }
        return { ...c, estadoCalculado };
      });
      setCuentas(procesadas);
    }
    setLoading(false);
  }, [supabase, activeCompany]);

  useEffect(() => {
    fetchCuentas();
  }, [fetchCuentas]);

  const handleOpenAbono = (cuenta: Cuenta) => {
    setSelectedCuenta(cuenta);
    setIsAbonoModalOpen(true);
  };

  const filteredCuentas = cuentas.filter(c => {
    const needle = searchTerm.toLowerCase();
    const matchesSearch = (c.pacientes?.nombre_completo ?? '').toLowerCase().includes(needle) || 
                          (c.pacientes?.codigo_interno ?? '').toLowerCase().includes(needle) ||
                          (c.notas ?? '').toLowerCase().includes(needle);
    
    if (filter === 'pendientes') return matchesSearch && c.estadoCalculado !== 'pagada';
    if (filter === 'vencidas') return matchesSearch && c.estadoCalculado === 'vencida';
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface p-4 rounded-xl shadow-sm border border-border gap-4">
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              placeholder="Buscar paciente..." 
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setFilter('todas')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${filter === 'todas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todas</button>
            <button onClick={() => setFilter('pendientes')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${filter === 'pendientes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pendientes</button>
            <button onClick={() => setFilter('vencidas')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${filter === 'vencidas' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vencidas</button>
          </div>
        </div>

        <button 
          onClick={() => setIsCuentaModalOpen(true)}
          className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-sm shrink-0 w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          <span className="font-medium text-sm">Nueva Cuenta</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-semibold">Paciente</th>
              <th className="p-4 font-semibold">Concepto / Vencimiento</th>
              <th className="p-4 font-semibold text-right">Deuda Total</th>
              <th className="p-4 font-semibold text-right">Saldo Restante</th>
              <th className="p-4 font-semibold text-center w-32">Estado</th>
              <th className="p-4 font-semibold text-right w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3 text-brand-500" />
                  Cargando cuentas...
                </td>
              </tr>
            ) : filteredCuentas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <Receipt size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium text-slate-700">No hay cuentas por cobrar</p>
                  <p className="text-sm">Genera una nueva cuenta manualmente o asigna un servicio.</p>
                </td>
              </tr>
            ) : (
              filteredCuentas.map((c) => {
                const saldo = parseFloat(c.monto_total) - parseFloat(c.monto_pagado);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{c.pacientes?.nombre_completo}</p>
                      <p className="text-xs text-slate-500 font-mono">{c.pacientes?.codigo_interno}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 font-medium">{c.notas || c.servicios?.nombre || 'Cobro Manual'}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <CalendarClock size={12}/> Vence: {parseDateOnly(c.fecha_vencimiento).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-medium text-slate-800 font-mono">L {parseFloat(c.monto_total).toFixed(2)}</p>
                      {(c.descuento_valor ?? 0) > 0 && (
                        <p className="text-xs text-brand-600 flex items-center justify-end gap-1"><Tag size={10}/> Descuento aplicado</p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <p className={`font-bold font-mono ${saldo > 0 ? 'text-brand-600' : 'text-green-600'}`}>L {saldo.toFixed(2)}</p>
                    </td>
                    <td className="p-4 text-center">
                      {c.estadoCalculado === 'pagada' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle size={14} className="mr-1" /> Pagada
                        </span>
                      ) : c.estadoCalculado === 'vencida' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle size={14} className="mr-1" /> Vencida
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <CalendarClock size={14} className="mr-1" /> Al Día
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenAbono(c)}
                        disabled={c.estadoCalculado === 'pagada'}
                        className={`transition-colors p-2 rounded-lg font-medium text-sm flex items-center gap-2 justify-end w-full ${c.estadoCalculado === 'pagada' ? 'text-slate-300 cursor-not-allowed' : 'text-brand-600 hover:bg-brand-50 hover:text-brand-700'}`} 
                        title="Registrar Abono"
                      >
                        <HandCoins size={18} /> Abonar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <CuentaModal 
        isOpen={isCuentaModalOpen} 
        onClose={() => setIsCuentaModalOpen(false)}
        onSuccess={fetchCuentas}
      />

      <AbonoModal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        cuenta={selectedCuenta}
        onSuccess={fetchCuentas}
      />
    </div>
  );
}
