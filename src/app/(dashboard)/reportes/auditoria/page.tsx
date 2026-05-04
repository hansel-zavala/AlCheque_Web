'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { History, Search, ArrowLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';

export default function AuditoriaPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('auditoria')
      .select(`
        *,
        users(nombre)
      `)
      .order('fecha_hora', { ascending: false });
    
    if (data) setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    log.tabla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.campo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.valor_nuevo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reportes" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <History className="text-brand-600" /> Historial de Auditoría
            </h1>
            <p className="text-sm text-slate-500">Registro de cambios críticos en el sistema</p>
          </div>
        </div>

        <div className="relative w-72">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar tabla o valor..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">Fecha / Hora</th>
              <th className="p-4 font-bold">Usuario</th>
              <th className="p-4 font-bold">Módulo</th>
              <th className="p-4 font-bold">Acción / Campo</th>
              <th className="p-4 font-bold">Valor Anterior</th>
              <th className="p-4 font-bold">Valor Nuevo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3 text-brand-500" />
                  Cargando logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500 italic">
                  No hay registros de auditoría que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.fecha_hora).toLocaleString('es-HN')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                        <User size={12} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{log.users?.nombre || 'Sistema'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {log.tabla}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-800">
                    {log.campo}
                  </td>
                  <td className="p-4 text-sm text-red-500 line-through max-w-[150px] truncate">
                    {log.valor_anterior || '-'}
                  </td>
                  <td className="p-4 text-sm text-green-600 font-medium max-w-[150px] truncate">
                    {log.valor_nuevo || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
