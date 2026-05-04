'use client';

import { useState } from 'react';
import { FileBarChart2, Table, History } from 'lucide-react';
import Link from 'next/link';
import { ReportViewModal } from '@/components/ReportViewModal';

export default function ReportesPage() {
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'flujo' | 'categorias' | 'morosidad'; title: string }>({
    isOpen: false,
    type: 'flujo',
    title: ''
  });

  const openReport = (type: 'flujo' | 'categorias' | 'morosidad', title: string) => {
    setModalConfig({ isOpen: true, type, title });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-100 p-3 rounded-2xl">
            <FileBarChart2 className="text-brand-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Centro de Reportes</h1>
            <p className="text-slate-500 text-sm">Analiza el rendimiento y salud financiera de tu centro</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reporte 1 */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col h-full border-t-4 border-t-green-500">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Flujo de Caja Mensual</h3>
          <p className="text-sm text-slate-500 flex-1 leading-relaxed">Resumen detallado de ingresos y egresos mes a mes para visualizar la rentabilidad neta.</p>
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => openReport('flujo', 'Flujo de Caja Mensual')}
              className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              <Table size={16} /> <span>Ver Reporte</span>
            </button>
          </div>
        </div>

        {/* Reporte 2 */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col h-full border-t-4 border-t-brand-500">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Análisis de Categorías</h3>
          <p className="text-sm text-slate-500 flex-1 leading-relaxed">Distribución de gastos e ingresos por categoría para identificar los rubros de mayor impacto.</p>
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => openReport('categorias', 'Análisis por Categorías')}
              className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              <Table size={16} /> <span>Ver Reporte</span>
            </button>
          </div>
        </div>

        {/* Reporte 3 */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col h-full border-t-4 border-t-red-500">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Morosidad y Cuentas</h3>
          <p className="text-sm text-slate-500 flex-1 leading-relaxed">Control total de deudas pendientes, saldos por cobrar y estados críticos de pago.</p>
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => openReport('morosidad', 'Reporte de Morosidad')}
              className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              <Table size={16} /> <span>Ver Reporte</span>
            </button>
          </div>
        </div>

        {/* Reporte 4 - Auditoría */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col h-full border-t-4 border-t-slate-400 bg-slate-50/30">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-slate-800">Bitácora de Auditoría</h3>
            <History size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 flex-1 leading-relaxed">Registro histórico de cada cambio, edición o anulación realizada en el sistema por cualquier usuario.</p>
          <div className="mt-8">
            <Link 
              href="/reportes/auditoria"
              className="w-full flex items-center justify-center space-x-2 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors text-sm font-bold"
            >
              <History size={16} /> <span>Ver Bitácora de Cambios</span>
            </Link>
          </div>
        </div>
      </div>

      <ReportViewModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        reportType={modalConfig.type}
        title={modalConfig.title}
      />
    </div>
  );
}
