'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Ene', ingresos: 40000, egresos: 24000 },
  { name: 'Feb', ingresos: 30000, egresos: 13980 },
  { name: 'Mar', ingresos: 20000, egresos: 9800 },
  { name: 'Abr', ingresos: 27800, egresos: 19080 },
  { name: 'May', ingresos: 18900, egresos: 4800 },
  { name: 'Jun', ingresos: 23900, egresos: 3800 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Ingresos del Mes</h3>
          <p className="text-2xl font-bold mt-2 text-green-600">L 45,000.00</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Egresos del Mes</h3>
          <p className="text-2xl font-bold mt-2 text-red-600">L 12,300.00</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Saldo Neto</h3>
          <p className="text-2xl font-bold mt-2 text-brand-600">L 32,700.00</p>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm min-h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Flujo de Caja (Últimos 6 meses)</h3>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
              <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="egresos" fill="#EF4444" radius={[4, 4, 0, 0]} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
