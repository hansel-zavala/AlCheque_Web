'use client';

import { Search, UserPlus, FileText } from 'lucide-react';

export default function PacientesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-border">
        <div className="relative w-72">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por código (ej. PAC-001)..." 
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
          />
        </div>
        
        <button className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
          <UserPlus size={18} />
          <span>Vincular Nuevo Paciente</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-medium">Código Interno</th>
              <th className="p-4 font-medium">Servicio Contratado</th>
              <th className="p-4 font-medium text-right">Tarifa Mensual</th>
              <th className="p-4 font-medium text-center">Beca Activa</th>
              <th className="p-4 font-medium text-right w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Ejemplo mockeado */}
            <tr className="hover:bg-slate-50 transition-colors group">
              <td className="p-4 font-medium text-slate-800">EXP-1045</td>
              <td className="p-4 text-slate-600">Terapia de Lenguaje (2/sem)</td>
              <td className="p-4 text-right font-medium">L 2,500.00</td>
              <td className="p-4 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                  Ninguna
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-md hover:bg-brand-50" title="Ver Historial">
                  <FileText size={16} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
