'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const supabase = createClient();
  const [ingresosMes, setIngresosMes] = useState(0);
  const [egresosMes, setEgresosMes] = useState(0);
  const [saldoNeto, setSaldoNeto] = useState(0);
  const [recentTrans, setRecentTrans] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      
      const now = new Date();
      // First day of current month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      // First day of 5 months ago (so we get 6 months total including current)
      const firstDaySixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

      const { data, error } = await supabase
        .from('transacciones')
        .select('id, tipo, monto_hnl, fecha, descripcion, anulado, categorias(nombre)')
        .gte('fecha', firstDaySixMonthsAgo)
        .order('fecha', { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        // EXCLUIR transacciones anuladas de todos los cálculos y vistas del Dashboard
        const validData = data.filter(t => !t.anulado);

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
        const chartAgg: Record<string, any> = {};
        
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
          // Adjust timezone offsets if necessary, but string parsing is usually fine here
          // Supabase returns 'YYYY-MM-DD' for date columns
          const [year, month, day] = t.fecha.split('-');
          const tDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const key = `${tDate.getFullYear()}-${tDate.getMonth()}`;
          
          if (chartAgg[key]) {
            if (t.tipo === 'ingreso') chartAgg[key].ingresos += t.monto_hnl;
            if (t.tipo === 'egreso') chartAgg[key].egresos += t.monto_hnl;
          }
        });

        // Convert object to sorted array
        const finalChartData = Object.values(chartAgg).sort((a: any, b: any) => a.sort - b.sort);
        setChartData(finalChartData);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
          <h3 className="text-sm font-medium text-slate-500">Ingresos del Mes</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{formatMoney(ingresosMes)}</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
          <h3 className="text-sm font-medium text-slate-500">Egresos del Mes</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">{formatMoney(egresosMes)}</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-brand-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-slate-500">Saldo Neto (Mes Actual)</h3>
            <p className={`text-3xl font-bold mt-2 ${saldoNeto >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
              {formatMoney(saldoNeto)}
            </p>
          </div>
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
                  formatter={(value: number) => [formatMoney(value), '']} 
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
    </div>
  );
}
