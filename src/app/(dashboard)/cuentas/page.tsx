'use client';

import { Search, AlertCircle, CheckCircle, HandCoins } from 'lucide-react';

export default function CuentasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-border">
        <div className="relative w-72">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por paciente o expediente..." 
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-medium">Expediente</th>
              <th className="p-4 font-medium">Concepto</th>
              <th className="p-4 font-medium text-right">Monto Total</th>
              <th className="p-4 font-medium text-right">Pagado</th>
              <th className="p-4 font-medium text-center">Estado</th>
              <th className="p-4 font-medium text-right w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Ejemplo Vencida */}
            <tr className="hover:bg-slate-50 transition-colors group">
              <td className="p-4 font-medium text-slate-800">EXP-1045</td>
              <td className="p-4 text-slate-600">Mensualidad Marzo 2026</td>
              <td className="p-4 text-right font-medium">L 2,500.00</td>
              <td className="p-4 text-right text-slate-500">L 1,000.00</td>
              <td className="p-4 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <AlertCircle size={12} className="mr-1" /> Vencida
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-md hover:bg-brand-50" title="Abonar">
                  <HandCoins size={16} />
                </button>
              </td>
            </tr>
            {/* Ejemplo Al Día */}
            <tr className="hover:bg-slate-50 transition-colors group">
              <td className="p-4 font-medium text-slate-800">EXP-2012</td>
              <td className="p-4 text-slate-600">Mensualidad Abril 2026</td>
              <td className="p-4 text-right font-medium">L 1,500.00</td>
              <td className="p-4 text-right text-slate-500">L 1,500.00</td>
              <td className="p-4 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle size={12} className="mr-1" /> Al Día
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-md hover:bg-brand-50" title="Visualizar Cuenta">
                  <HandCoins size={16} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
