'use client';

import { Search, Plus, ShieldCheck } from 'lucide-react';

export default function BecasPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-surface p-4 rounded-xl shadow-sm border border-border">
        <div className="relative w-full sm:w-72">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar becas por expediente..." 
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
          />
        </div>
        
        <button className="flex items-center justify-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
          <Plus size={18} />
          <span>Otorgar Beca</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-medium">Expediente</th>
              <th className="p-4 font-medium">Tipo de Beca</th>
              <th className="p-4 font-medium text-right">Valor</th>
              <th className="p-4 font-medium text-center">Vigencia</th>
              <th className="p-4 font-medium text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50 transition-colors group">
              <td className="p-4 font-medium text-slate-800">EXP-0518</td>
              <td className="p-4 text-slate-600">Porcentaje (Descuento Social)</td>
              <td className="p-4 text-right font-medium text-brand-600">50%</td>
              <td className="p-4 text-center text-slate-500 text-sm">1/Ene/2026 - 31/Dic/2026</td>
              <td className="p-4 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                  <ShieldCheck size={12} className="mr-1" /> Activa
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
