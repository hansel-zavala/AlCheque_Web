'use client';

import { PlusCircle, MinusCircle, FileDown, Search } from 'lucide-react';

export default function TransaccionesPage() {
  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl shadow-sm border border-border">
        <div className="flex space-x-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
            <PlusCircle size={18} />
            <span>Registrar Ingreso</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
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
              <th className="p-4 font-medium w-32 text-right">Monto (HNL)</th>
              <th className="p-4 font-medium w-24 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Ejemplo mockeado Ingreso */}
            <tr className="hover:bg-slate-50 transition-colors group">
              <td className="p-4 text-sm text-slate-600">14 Abr 2026</td>
              <td className="p-4 font-medium text-slate-800">
                Pago Mensualidad Abril
                <div className="text-xs text-slate-500 font-normal mt-0.5">Paciente: EXP-1045</div>
              </td>
              <td className="p-4 text-sm text-slate-600">Mensualidades</td>
              <td className="p-4 text-sm text-slate-600 font-mono">00142</td>
              <td className="p-4 text-right font-medium text-green-600">+ 2,500.00</td>
              <td className="p-4 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                  Pagado
                </span>
              </td>
            </tr>
            {/* Ejemplo mockeado Egreso */}
            <tr className="hover:bg-slate-50 transition-colors group">
              <td className="p-4 text-sm text-slate-600">12 Abr 2026</td>
              <td className="p-4 font-medium text-slate-800">
                Luz Eléctrica ENEE
              </td>
              <td className="p-4 text-sm text-slate-600">Servicios Básicos</td>
              <td className="p-4 text-sm text-slate-600 font-mono">--</td>
              <td className="p-4 text-right font-medium text-red-600">- 4,200.00</td>
              <td className="p-4 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                  Pagado
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
