'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, DollarSign, ArrowUpRight, ArrowDownRight, 
  Wallet, CreditCard, Landmark, Receipt, Download, 
  Loader2, PieChart, TrendingUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/utils/supabase/client';
import { useCompanyStore } from '@/store/useCompanyStore';

type Transaccion = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto_hnl: number;
  fecha: string;
  metodo_pago: string | null;
  descripcion: string | null;
  estado: string;
  categorias: { nombre: string } | null;
};

type Cuenta = {
  id: string;
  estado: 'al_dia' | 'por_vencer' | 'vencida' | 'pagada';
  monto_total: number;
  monto_pagado: number;
};

export default function ReportesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeCompany } = useCompanyStore();
  const [loading, setLoading] = useState(true);

  // Fechas (Por defecto este mes)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cuentasPendientes, setCuentasPendientes] = useState<Cuenta[]>([]);

  // Tab seleccionada para el detalle de métodos de pago
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('todos');

  const fetchData = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);

    // 1. Obtener transacciones en el rango
    const { data: txs } = await supabase
      .from('transacciones')
      .select('id, tipo, monto_hnl, fecha, metodo_pago, descripcion, estado, categorias(nombre)')
      .eq('company_id', activeCompany.id)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: false });

    if (txs) setTransacciones(txs as unknown as Transaccion[]);

    // 2. Obtener cuentas pendientes en el rango (para proyección)
    const { data: ctas } = await supabase
      .from('cuentas_por_cobrar')
      .select('id, estado, monto_total, monto_pagado')
      .eq('company_id', activeCompany.id)
      .neq('estado', 'pagada')
      .gte('fecha_vencimiento', startDate)
      .lte('fecha_vencimiento', endDate);

    if (ctas) setCuentasPendientes(ctas as Cuenta[]);

    setLoading(false);
  }, [supabase, activeCompany, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cálculos de Resumen General
  const ingresos = transacciones.filter(t => t.tipo === 'ingreso' && t.estado !== 'anulado');
  const egresos = transacciones.filter(t => t.tipo === 'egreso' && t.estado !== 'anulado');

  const totalIngresos = ingresos.reduce((acc, t) => acc + Number(t.monto_hnl), 0);
  const totalEgresos = egresos.reduce((acc, t) => acc + Number(t.monto_hnl), 0);
  const flujoNeto = totalIngresos - totalEgresos;

  const proyeccionCobrar = cuentasPendientes.reduce((acc, c) => acc + (Number(c.monto_total) - Number(c.monto_pagado)), 0);

  // Cálculos de Método de Pago (solo ingresos efectivos para arqueo)
  const metodos = [
    { id: 'efectivo', nombre: 'Efectivo', icon: BanknoteIcon, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { id: 'transferencia', nombre: 'Transferencia', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'tarjeta de credito/debito', nombre: 'Tarjeta', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'cheque', nombre: 'Cheque', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const transaccionesPorMetodo = (metodoId: string) => 
    ingresos.filter(t => (t.metodo_pago?.toLowerCase() || 'efectivo') === metodoId);

  const totalPorMetodo = (metodoId: string) => 
    transaccionesPorMetodo(metodoId).reduce((acc, t) => acc + Number(t.monto_hnl), 0);

  // Categorías de Ingresos y Egresos
  const agruparCategorias = (txs: Transaccion[]) => {
    const grupos: Record<string, number> = {};
    txs.forEach(t => {
      const cat = t.categorias?.nombre || 'Sin Categoría';
      grupos[cat] = (grupos[cat] || 0) + Number(t.monto_hnl);
    });
    return Object.entries(grupos).sort((a, b) => b[1] - a[1]); // Mayor a menor
  };

  const categoriasIngreso = agruparCategorias(ingresos);
  const categoriasEgreso = agruparCategorias(egresos);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text(`Cierre de Caja: ${activeCompany?.name || 'AlCheque'}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Periodo analizado: ${startDate} al ${endDate}`, 14, 32);

    // Resumen General
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Resumen General', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Concepto', 'Monto']],
      body: [
        ['Total Ingresos', `L ${totalIngresos.toFixed(2)}`],
        ['Total Egresos', `L ${totalEgresos.toFixed(2)}`],
        ['Flujo Neto', `L ${flujoNeto.toFixed(2)}`],
        ['Por Cobrar (Proyección)', `L ${proyeccionCobrar.toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
      styles: { fontSize: 10 }
    });

    // Desglose por Método
    const finalY1 = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.text('Desglose por Método de Pago (Ingresos)', 14, finalY1 + 15);
    
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Método', 'Total Recaudado']],
      body: metodos.map(m => [m.nombre, `L ${totalPorMetodo(m.id).toFixed(2)}`]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Blue 500
      styles: { fontSize: 10 }
    });

    // Categorías de Ingreso
    const finalY2 = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.text('Ingresos por Categoría', 14, finalY2 + 15);
    
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Categoría', 'Total']],
      body: categoriasIngreso.map(c => [c[0], `L ${c[1].toFixed(2)}`]),
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139] }, // Slate 500
      styles: { fontSize: 9 }
    });

    // Nueva Página para el listado detallado
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Historial Detallado de Ingresos', 14, 20);

    autoTable(doc, {
      startY: 25,
      head: [['Fecha', 'Descripción', 'Método', 'Categoría', 'Monto']],
      body: ingresos.map(t => [
        new Date(t.fecha + 'T00:00:00').toLocaleDateString(),
        t.descripcion || '',
        t.metodo_pago || 'Efectivo',
        t.categorias?.nombre || 'General',
        `L ${Number(t.monto_hnl).toFixed(2)}`
      ]),
      theme: 'striped',
      styles: { fontSize: 8 }
    });

    // Si hay egresos, agregar tabla de egresos
    if (egresos.length > 0) {
      const finalY3 = (doc as any).lastAutoTable.finalY || 20;
      doc.setFontSize(14);
      doc.text('Historial Detallado de Egresos', 14, finalY3 + 15);

      autoTable(doc, {
        startY: finalY3 + 20,
        head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
        body: egresos.map(t => [
          new Date(t.fecha + 'T00:00:00').toLocaleDateString(),
          t.descripcion || '',
          t.categorias?.nombre || 'General',
          `L ${Number(t.monto_hnl).toFixed(2)}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [244, 63, 94] }, // Rose 500
        styles: { fontSize: 8 }
      });
    }

    doc.save(`Cierre_${activeCompany?.name?.replace(/\s+/g, '_')}_${startDate}_al_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      
      {/* HEADER & FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cierre y Reportes Financieros</h1>
          <p className="text-sm text-slate-500">Analiza el flujo de caja y audita los métodos de pago.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar size={16} className="text-slate-500" />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            />
            <span className="text-slate-400">a</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            />
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
      ) : (
        <>
          {/* A. RESUMEN GENERAL */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Total Ingresos</p>
                <div className="bg-emerald-100 p-2 rounded-lg"><ArrowUpRight size={18} className="text-emerald-600"/></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 font-mono">L {totalIngresos.toFixed(2)}</h3>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Total Egresos</p>
                <div className="bg-rose-100 p-2 rounded-lg"><ArrowDownRight size={18} className="text-rose-600"/></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 font-mono">L {totalEgresos.toFixed(2)}</h3>
            </div>
            
            <div className="bg-brand-50 p-5 rounded-2xl border border-brand-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-brand-700">Flujo Neto</p>
                <div className="bg-brand-200 p-2 rounded-lg"><TrendingUp size={18} className="text-brand-700"/></div>
              </div>
              <h3 className={`text-2xl font-bold font-mono ${flujoNeto >= 0 ? 'text-brand-700' : 'text-rose-600'}`}>
                L {flujoNeto.toFixed(2)}
              </h3>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Por Cobrar (Proyección)</p>
                <div className="bg-orange-100 p-2 rounded-lg"><DollarSign size={18} className="text-orange-600"/></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 font-mono">L {proyeccionCobrar.toFixed(2)}</h3>
            </div>
          </div>

          {/* B. DESGLOSE POR MÉTODO DE PAGO */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wallet size={20} className="text-slate-400" /> Arqueo de Ingresos por Método de Pago
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {metodos.map(m => {
                const total = totalPorMetodo(m.id);
                const isSelected = metodoSeleccionado === m.id;
                return (
                  <div 
                    key={m.id}
                    onClick={() => setMetodoSeleccionado(isSelected ? 'todos' : m.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-brand-500 ring-1 ring-brand-500 shadow-md bg-brand-50' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-1.5 rounded-md ${m.bg}`}><m.icon size={16} className={m.color} /></div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-brand-800' : 'text-slate-700'}`}>{m.nombre}</p>
                    </div>
                    <p className={`text-xl font-bold font-mono ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>L {total.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            {/* TABLA DE DETALLE DE MÉTODO */}
            {metodoSeleccionado !== 'todos' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    Detalle de Ingresos: <span className="text-brand-600">{metodos.find(m => m.id === metodoSeleccionado)?.nombre}</span>
                  </h3>
                  <button onClick={() => setMetodoSeleccionado('todos')} className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-medium px-2 py-1">Cerrar Detalle</button>
                </div>
                <div className="overflow-x-auto max-h-80 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 border-b border-slate-100 shadow-sm z-10">
                      <tr>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500">Fecha</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500">Descripción</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500">Categoría</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {transaccionesPorMetodo(metodoSeleccionado).length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-400">No hay transacciones registradas con este método.</td></tr>
                      ) : (
                        transaccionesPorMetodo(metodoSeleccionado).map(t => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 text-slate-600">{new Date(t.fecha + 'T00:00:00').toLocaleDateString()}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">{t.descripcion}</td>
                            <td className="py-2.5 px-4 text-slate-500">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{t.categorias?.nombre || 'General'}</span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-medium text-emerald-600">
                              + L {Number(t.monto_hnl).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* C. DESGLOSE POR CATEGORÍAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Ingresos por categoría */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChart size={18} className="text-emerald-500"/> Ingresos por Categoría
              </h3>
              <div className="space-y-5">
                {categoriasIngreso.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Sin datos de ingresos</p>
                ) : (
                  categoriasIngreso.map(([cat, monto]) => {
                    const porcentaje = (monto / totalIngresos) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-700">{cat}</span>
                          <span className="font-mono text-slate-600 font-medium">L {monto.toFixed(2)} <span className="text-slate-400 font-sans text-xs">({porcentaje.toFixed(1)}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${porcentaje}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Egresos por categoría */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChart size={18} className="text-rose-500"/> Egresos por Categoría
              </h3>
              <div className="space-y-5">
                {categoriasEgreso.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Sin datos de egresos</p>
                ) : (
                  categoriasEgreso.map(([cat, monto]) => {
                    const porcentaje = (monto / totalEgresos) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-700">{cat}</span>
                          <span className="font-mono text-slate-600 font-medium">L {monto.toFixed(2)} <span className="text-slate-400 font-sans text-xs">({porcentaje.toFixed(1)}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${porcentaje}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          
        </>
      )}
    </div>
  );
}

// Icono faltante exportado internamente
function BanknoteIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
