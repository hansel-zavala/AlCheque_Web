'use client';

import { Settings, BarChart3, Target } from 'lucide-react';

export default function PresupuestoPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-surface p-4 rounded-xl shadow-sm border border-border">
        <div className="flex items-center space-x-2">
          <Target className="text-brand-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Presupuesto Mensual</h2>
        </div>
        
        <div className="flex space-x-2">
          <select className="border border-border rounded-lg px-4 py-2 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option>Abril 2026</option>
            <option>Mayo 2026</option>
          </select>
          <button className="flex items-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors border border-border shadow-sm">
            <Settings size={18} />
            <span>Configurar Mes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Presupuesto Específico */}
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <BarChart3 className="mr-2 text-slate-400" size={18} />
            Ejecución por Categoría de Egreso
          </h3>
          
          <div className="space-y-6">
            {/* Categoria 1 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">Pago de Terapeutas</span>
                <span className="text-slate-500">L 25,000 / L 30,000</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '83%' }}></div>
              </div>
              <p className="text-xs text-slate-400 mt-1">83% del presupuesto consumido</p>
            </div>

            {/* Categoria 2 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">Mantenimiento de Instalaciones</span>
                <span className="text-slate-500">L 4,500 / L 5,000</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <p className="text-xs text-yellow-600 font-medium mt-1">Cerca del límite (90%)</p>
            </div>

            {/* Categoria 3 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">Publicidad y Redes</span>
                <span className="text-slate-500">L 3,200 / L 3,000</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-red-600 font-medium mt-1">Presupuesto excedido por L 200</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl shadow-inner border border-slate-200 flex flex-col justify-center items-center text-center">
          <div className="w-32 h-32 rounded-full border-8 border-brand-500 flex items-center justify-center mb-4 text-brand-600 shadow-sm bg-white">
            <span className="text-2xl font-bold">78%</span>
          </div>
          <h4 className="font-semibold text-slate-800 text-lg">Presupuesto Global</h4>
          <p className="text-sm text-slate-500 mt-2">Se han gastado L 32,700 de un total de L 42,000 estipulados para este mes.</p>
        </div>
      </div>
    </div>
  );
}
