'use client';

import { FileBarChart2, Download, Table } from 'lucide-react';

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileBarChart2 className="text-brand-600" size={28} />
        <h1 className="text-2xl font-bold text-slate-800">Centro de Reportes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reporte 1 */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Flujo de Caja Mensual</h3>
          <p className="text-sm text-slate-500 flex-1">Movimiento de dinero mes a mes resumiendo ingresos y egresos para ver el saldo neto.</p>
          <div className="mt-6 flex space-x-2">
            <button className="flex-1 flex items-center justify-center space-x-2 bg-brand-50 text-brand-700 py-2 rounded-lg hover:bg-brand-100 transition-colors">
              <Table size={16} /> <span>Ver Datos</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 px-4 rounded-lg hover:bg-brand-600 hover:text-white transition-colors" title="Exportar">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Reporte 2 */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Análisis de Categorías</h3>
          <p className="text-sm text-slate-500 flex-1">Identificar qué servicio genera más ingresos o en qué rubro se gasta más el presupuesto.</p>
          <div className="mt-6 flex space-x-2">
            <button className="flex-1 flex items-center justify-center space-x-2 bg-brand-50 text-brand-700 py-2 rounded-lg hover:bg-brand-100 transition-colors">
              <Table size={16} /> <span>Ver Datos</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 px-4 rounded-lg hover:bg-brand-600 hover:text-white transition-colors" title="Exportar">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Reporte 3 */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Morosidad y Cuentas</h3>
          <p className="text-sm text-slate-500 flex-1">Listado extenso de deudas pendientes por orden de años o estado crítico.</p>
          <div className="mt-6 flex space-x-2">
            <button className="flex-1 flex items-center justify-center space-x-2 bg-brand-50 text-brand-700 py-2 rounded-lg hover:bg-brand-100 transition-colors">
              <Table size={16} /> <span>Ver Datos</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 px-4 rounded-lg hover:bg-brand-600 hover:text-white transition-colors" title="Exportar">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Reporte 4 */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Histórico de Auditoría</h3>
          <p className="text-sm text-slate-500 flex-1">Muestra cada movimiento destructivo (anular o editar) realizado por usuarios.</p>
          <div className="mt-6 flex space-x-2">
            <button className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 text-slate-400 py-2 rounded-lg cursor-not-allowed">
              <Table size={16} /> <span>Solo Director</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
