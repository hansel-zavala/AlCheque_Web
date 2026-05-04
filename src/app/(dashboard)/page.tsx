'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type TransaccionRow = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto_hnl: number;
  fecha: string;
  descripcion: string;
  anulado: boolean | null;
  categorias: { nombre: string | null } | null;
};

type ChartBucket = {
  name: string;
  ingresos: number;
  egresos: number;
  sort: number;
};

type CuentaVencimientoRow = {
  id: string;
  monto_total: string;
  monto_pagado: string;
  fecha_vencimiento: string;
  pacientes: { nombre_completo: string | null } | null;
};

type CuentaSaldoRow = {
  monto_total: string;
  monto_pagado: string;
};

export default function DashboardPage() {
  // Avoid recreating the Supabase client on every render.
  const supabase = useMemo(() => createClient(), []);
  const [ingresosMes, setIngresosMes] = useState(0);
  const [egresosMes, setEgresosMes] = useState(0);
  const [saldoNeto, setSaldoNeto] = useState(0);
  const [recentTrans, setRecentTrans] = useState<TransaccionRow[]>([]);
  const [chartData, setChartData] = useState<ChartBucket[]>([]);
  const [vencimientos, setVencimientos] = useState<CuentaVencimientoRow[]>([]);
  const [totalPorCobrar, setTotalPorCobrar] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      
      const now = new Date();
      // First day of current month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      // First day of 5 months ago (so we get 6 months total including current)
      const firstDaySixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

      // Fetch in parallel to avoid request waterfalls.
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const transaccionesPromise = supabase
        .from('transacciones')
        .select('id, tipo, monto_hnl, fecha, descripcion, anulado, categorias(nombre)')
        .gte('fecha', firstDaySixMonthsAgo)
        .order('fecha', { ascending: false })
        .returns<TransaccionRow[]>();

      const vencimientosPromise = supabase
        .from('cuentas_por_cobrar')
        .select('id, monto_total, monto_pagado, fecha_vencimiento, pacientes(nombre_completo)')
        .eq('estado', 'al_dia') // Only fetch those not paid yet, our UI sets 'pagada'
        .lte('fecha_vencimiento', nextWeekStr)
        .order('fecha_vencimiento', { ascending: true })
        .limit(5)
        .returns<CuentaVencimientoRow[]>();

      const totalPorCobrarPromise = supabase
        .from('cuentas_por_cobrar')
        .select('monto_total, monto_pagado')
        .neq('estado', 'pagada')
        .returns<CuentaSaldoRow[]>();

      const [
        { data: transacciones, error: transError },
        { data: cuentasData, error: cuentasError },
        { data: allCuentas, error: totalError },
      ] = await Promise.all([transaccionesPromise, vencimientosPromise, totalPorCobrarPromise]);

      if (transError) {
        console.error(transError);
      }

      if (transacciones) {
        // EXCLUIR transacciones anuladas de todos los cálculos y vistas del Dashboard
        const validData = transacciones.filter(t => !t.anulado);

        let ingresos = 0;
        let egresos = 0;

        // Calculate current month totals
        validData.forEach(t => {
          if (new Date(t.fecha) >= new Date(firstDayOfMonth)) {
            if (t.tipo === 'ingreso') ingresos += t.monto_hnl;
            if (t.tipo === 'egreso') egresos += t.monto_hnl;
          }
        });

        setIngresosMes(ingresos);
        setEgresosMes(egresos);
        setSaldoNeto(ingresos - egresos);

        // Get up to 5 most recent VALID transactions
        setRecentTrans(validData.slice(0, 5));

        // Group data for the last 6 months for the chart
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const chartAgg: Record<string, ChartBucket> = {};

        // Initialize buckets
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          chartAgg[key] = {
            name: meses[d.getMonth()],
            ingresos: 0,
            egresos: 0,
            sort: d.getTime() // used to sort the buckets chronologically
          };
        }

        // Fill buckets
        validData.forEach(t => {
          // Supabase returns 'YYYY-MM-DD' for date columns
          const [year, month, day] = t.fecha.split('-');
          const tDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const key = `${tDate.getFullYear()}-${tDate.getMonth()}`;

          if (chartAgg[key]) {
            if (t.tipo === 'ingreso') chartAgg[key].ingresos += t.monto_hnl;
            if (t.tipo === 'egreso') chartAgg[key].egresos += t.monto_hnl;
          }
        });

        const finalChartData = Object.values(chartAgg).sort((a, b) => a.sort - b.sort);
        setChartData(finalChartData);
      }

      if (cuentasError) {
        console.error(cuentasError);
      }
      if (cuentasData) {
        setVencimientos(cuentasData);
      }

      if (totalError) {
        console.error(totalError);
      }
      if (allCuentas) {
        const total = allCuentas.reduce((acc, c) => acc + (parseFloat(c.monto_total) - parseFloat(c.monto_pagado)), 0);
        setTotalPorCobrar(total);
      }

      setLoading(false);
    }

    fetchDashboardData();
  }, [supabase]);

  // Formatter helpers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-brand-600">
        <Loader2 size={48} className="animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm transition-all hover:shadow-md border-b-4 border-b-green-500">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ingresos (Mes)</h3>
          <p className="text-3xl font-black mt-2 text-green-600 font-mono">{formatMoney(ingresosMes)}</p>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm transition-all hover:shadow-md border-b-4 border-b-red-500">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Egresos (Mes)</h3>
          <p className="text-3xl font-black mt-2 text-red-600 font-mono">{formatMoney(egresosMes)}</p>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm transition-all hover:shadow-md border-b-4 border-b-brand-500">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saldo Neto</h3>
          <p className={`text-3xl font-black mt-2 font-mono ${saldoNeto >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
            {formatMoney(saldoNeto)}
          </p>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm transition-all hover:shadow-md border-b-4 border-b-orange-500">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total por Cobrar</h3>
          <p className="text-3xl font-black mt-2 text-orange-600 font-mono">{formatMoney(totalPorCobrar)}</p>
        </div>
      </div>

      {/* Lower Section: Chart and Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Flujo de Caja (Últimos 6 meses)</h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(val) => `L ${val / 1000}k`} />
                  <Tooltip 
                    cursor={{fill: '#F1F5F9'}} 
                    contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: unknown) => [formatMoney(Number(value)), '']} 
                  />
                <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={50} />
                <Bar dataKey="egresos" fill="#EF4444" radius={[4, 4, 0, 0]} name="Egresos" maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Transacciones Recientes</h3>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto">
            {recentTrans.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100/50">
                <div className="overflow-hidden pr-3">
                  <p className="text-sm font-medium text-slate-800 truncate" title={t.descripcion}>{t.descripcion}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {new Date(t.fecha).toLocaleDateString('es-HN', { month: 'short', day: 'numeric' })} • {t.categorias?.nombre || 'Sin categoría'}
                  </p>
                </div>
                <p className={`text-sm font-bold whitespace-nowrap ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.tipo === 'ingreso' ? '+' : '-'} {formatMoney(t.monto_hnl)}
                </p>
              </div>
            ))}

            {recentTrans.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-sm text-slate-500">No hay transacciones registradas.</p>
                <Link href="/transacciones" className="text-brand-600 text-sm font-medium mt-2 hover:underline">Crear primera</Link>
              </div>
            )}
          </div>
          
          <Link 
            href="/transacciones" 
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200"
          >
            <span>Ver todas las transacciones</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Vencimientos Widget */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-red-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Alertas de Cobro (Próximos 7 días)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {vencimientos.length === 0 ? (
              <p className="text-sm text-slate-500 col-span-full">No hay cuentas por vencer en los próximos 7 días.</p>
            ) : (
              vencimientos.map(v => {
                const saldo = parseFloat(v.monto_total) - parseFloat(v.monto_pagado);
                const isVencida = v.fecha_vencimiento < new Date().toISOString().split('T')[0];
                return (
                  <div key={v.id} className={`p-4 rounded-xl border ${isVencida ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                    <p
                      className="font-semibold text-slate-800 truncate"
                      title={v.pacientes?.nombre_completo ?? undefined}
                    >
                      {v.pacientes?.nombre_completo ?? 'Sin nombre'}
                    </p>
                    <p className={`text-xs font-medium mt-1 ${isVencida ? 'text-red-600' : 'text-orange-600'}`}>
                      {isVencida ? 'Vencida el' : 'Vence el'} {new Date(v.fecha_vencimiento).toLocaleDateString('es-HN')}
                    </p>
                    <p className="font-mono font-bold mt-2 text-slate-800">L {saldo.toFixed(2)}</p>
                    <Link href="/cuentas" className="text-xs font-medium text-brand-600 mt-3 inline-block hover:underline">Gestionar Cobro &rarr;</Link>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
