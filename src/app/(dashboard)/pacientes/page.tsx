'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, UserPlus, FileText, Loader2, Users } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import { useCompanyStore } from '@/store/useCompanyStore';

const PacienteDrawer = dynamic(
  () => import('@/components/PacienteDrawer').then((m) => m.PacienteDrawer),
  { ssr: false }
);

type Paciente = {
  id: string;
  codigo_interno: string;
  nombre_completo: string;
  nombre_tutor: string;
  grado_escolar: string;
};

export default function PacientesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const { activeCompany } = useCompanyStore();

  const fetchPacientes = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    const { data } = await supabase
      .from('pacientes')
      .select('*')
      .eq('company_id', activeCompany.id)
      .order('nombre_completo', { ascending: true });
       
    if (data) setPacientes(data);
    setLoading(false);
  }, [supabase, activeCompany]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const handleOpenDrawer = (id: string | null = null) => {
    setSelectedPacienteId(id);
    setIsDrawerOpen(true);
  };

  const filteredPacientes = pacientes.filter(p => 
    p.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface p-4 rounded-xl shadow-sm border border-border gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o código..." 
            className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all shadow-inner"
          />
        </div>
        
        <button 
          onClick={() => handleOpenDrawer()}
          className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-sm hover:shadow"
        >
          <UserPlus size={18} />
          <span className="font-medium">Nuevo Paciente</span>
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-semibold">Código</th>
              <th className="p-4 font-semibold">Estudiante</th>
              <th className="p-4 font-semibold">Tutor / Padre</th>
              <th className="p-4 font-semibold w-32 text-center">Grado</th>
              <th className="p-4 font-semibold text-right w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3 text-brand-500" />
                  Cargando pacientes...
                </td>
              </tr>
            ) : filteredPacientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                  <Users size={40} className="text-slate-300 mb-3" />
                  <p className="text-lg font-medium text-slate-700">No hay pacientes registrados</p>
                  <p className="text-sm">Agrega un nuevo paciente para comenzar.</p>
                </td>
              </tr>
            ) : (
              filteredPacientes.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleOpenDrawer(p.id)}>
                  <td className="p-4 font-mono text-sm text-slate-500">{p.codigo_interno || 'N/A'}</td>
                  <td className="p-4 font-medium text-slate-800">{p.nombre_completo}</td>
                  <td className="p-4 text-slate-600 text-sm">{p.nombre_tutor || 'No registrado'}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                      {p.grado_escolar || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenDrawer(p.id); }}
                      className="text-brand-600 hover:text-brand-800 transition-colors p-2 rounded-lg hover:bg-brand-50" 
                      title="Ver Perfil Completo"
                    >
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PacienteDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        pacienteId={selectedPacienteId}
        onSuccess={() => {
          fetchPacientes();
        }}
      />
    </div>
  );
}
