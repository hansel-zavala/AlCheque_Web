'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Receipt, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { parseDateOnly } from '@/utils/date';

type HistorialItem = {
  id: string;
  tipo: 'transaccion' | 'cuenta' | 'abono';
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: 'HNL' | 'USD';
  estado?: string;
  subtipo?: string; // 'ingreso' | 'egreso' | 'pagada' | 'pendiente' | 'vencida'
};

interface PacienteHistorialProps {
  pacienteId: string;
  nombrePaciente: string;
}

export function PacienteHistorial({ pacienteId, nombrePaciente: _nombrePaciente }: PacienteHistorialProps) {
  void _nombrePaciente;
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todo' | 'transacciones' | 'cuentas' | 'abonos'>('todo');

  const fetchHistorial = useCallback(async () => {
    setLoading(true);

    // 1. Transacciones del paciente
    const { data: txns } = await supabase
      .from('transacciones')
      .select('id, tipo, fecha, descripcion, monto_hnl, monto_usd, estado, anulado')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });

    // 2. Cuentas por cobrar del paciente
    const { data: cuentas } = await supabase
      .from('cuentas_por_cobrar')
      .select('id, fecha_vencimiento, monto_total, monto_pagado, estado, notas, servicios(nombre)')
      .eq('paciente_id', pacienteId)
      .order('fecha_vencimiento', { ascending: false });

    // 3. Abonos del paciente (a través de cuentas)
    // Actualmente no se muestra en UI; evitamos la consulta por ahora.

    const lista: HistorialItem[] = [];

    txns?.forEach(t => {
      lista.push({
        id: t.id,
        tipo: 'transaccion',
        fecha: t.fecha,
        descripcion: t.anulado ? `[ANULADO] ${t.descripcion}` : t.descripcion,
        monto: t.monto_usd ?? t.monto_hnl,
        moneda: t.monto_usd ? 'USD' : 'HNL',
        estado: t.anulado ? 'anulado' : t.estado,
        subtipo: t.tipo,
      });
    });

    type CuentaRow = {
      id: string;
      fecha_vencimiento: string;
      monto_total: string;
      estado: string;
      notas: string | null;
      servicios: { nombre: string | null } | null;
    };

    (cuentas as unknown as CuentaRow[] | null | undefined)?.forEach((c) => {
      const today = new Date().toISOString().split('T')[0];
      let estadoReal = c.estado;
      if (c.estado !== 'pagada' && c.fecha_vencimiento < today) estadoReal = 'vencida';
      lista.push({
        id: c.id,
        tipo: 'cuenta',
        fecha: c.fecha_vencimiento,
        descripcion: c.notas || c.servicios?.nombre || 'Cobro de servicio',
        monto: parseFloat(c.monto_total),
        moneda: 'HNL',
        estado: estadoReal,
        subtipo: estadoReal,
      });
    });

    /*abonos?.forEach((a: any) => {
      lista.push({
        id: a.id,
        tipo: 'abono',
        fecha: a.fecha,
        descripcion: `Abono${a.metodo_pago ? ` · ${a.metodo_pago}` : ''}`,
        monto: a.monto,
        moneda: 'HNL',
        estado: 'pagado',
        subtipo: 'abono',
      });
    });*/

    // Ordenar por fecha descendente
    lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    setItems(lista);
    setLoading(false);
  }, [supabase, pacienteId]);

  useEffect(() => { fetchHistorial(); }, [fetchHistorial]);

  const filtered = filtro === 'todo' ? items : items.filter(i => {
    if (filtro === 'transacciones') return i.tipo === 'transaccion';
    if (filtro === 'cuentas') return i.tipo === 'cuenta';
    if (filtro === 'abonos') return i.tipo === 'abono';
    return true;
  });

  // Totales
  const totalPagado = items.filter(i => i.tipo === 'abono').reduce((s, i) => s + i.monto, 0);
  const totalPendiente = items.filter(i => i.tipo === 'cuenta' && i.estado !== 'pagada').reduce((s, i) => s + i.monto, 0);

  const getIcon = (item: HistorialItem) => {
    if (item.tipo === 'transaccion') {
      if (item.estado === 'anulado') return <XCircle size={18} className="text-slate-400" />;
      return item.subtipo === 'ingreso'
        ? <ArrowUpCircle size={18} className="text-green-500" />
        : <ArrowDownCircle size={18} className="text-red-500" />;
    }
    if (item.tipo === 'cuenta') {
      if (item.estado === 'pagada') return <CheckCircle2 size={18} className="text-green-500" />;
      if (item.estado === 'vencida') return <XCircle size={18} className="text-red-500" />;
      return <Clock size={18} className="text-orange-500" />;
    }
    return <CreditCard size={18} className="text-brand-500" />;
  };

  const getBadge = (item: HistorialItem) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider';
    if (item.tipo === 'transaccion') {
      if (item.estado === 'anulado') return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>Anulado</span>;
      return item.subtipo === 'ingreso'
        ? <span className={`${base} bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400`}>Ingreso</span>
        : <span className={`${base} bg-red-100 dark:bg-rose-950/40 text-red-700 dark:text-rose-400`}>Egreso</span>;
    }
    if (item.tipo === 'cuenta') {
      if (item.estado === 'pagada') return <span className={`${base} bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400`}>Pagada</span>;
      if (item.estado === 'vencida') return <span className={`${base} bg-red-100 dark:bg-rose-950/40 text-red-700 dark:text-rose-400`}>Vencida</span>;
      return <span className={`${base} bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400`}>Pendiente</span>;
    }
    return <span className={`${base} bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400`}>Abono</span>;
  };

  const getMonto = (item: HistorialItem) => {
    const prefix = item.moneda === 'USD' ? '$' : 'L';
    const colorClass =
      item.tipo === 'abono' ? 'text-brand-600 dark:text-brand-400' :
      item.tipo === 'cuenta' && item.estado !== 'pagada' ? 'text-orange-600 dark:text-orange-400' :
      item.subtipo === 'ingreso' ? 'text-green-600 dark:text-emerald-400' :
      item.subtipo === 'egreso' ? 'text-red-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400';
    return (
      <span className={`font-bold font-mono ${colorClass} ${item.estado === 'anulado' ? 'line-through opacity-50' : ''}`}>
        {prefix} {item.monto.toFixed(2)}
      </span>
    );
  };

  const tabItems: { key: typeof filtro; label: string; count: number }[] = [
    { key: 'todo', label: 'Todo', count: items.length },
    { key: 'transacciones', label: 'Transacciones', count: items.filter(i => i.tipo === 'transaccion').length },
    { key: 'cuentas', label: 'Cuentas', count: items.filter(i => i.tipo === 'cuenta').length },
    { key: 'abonos', label: 'Abonos', count: items.filter(i => i.tipo === 'abono').length },
  ];

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 dark:bg-emerald-950/20 border border-green-100 dark:border-emerald-900/30 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-700 dark:text-emerald-400 uppercase tracking-wider">Total Abonado</p>
          <p className="text-xl font-bold text-green-700 dark:text-emerald-400 font-mono mt-1">L {totalPagado.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-3">
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Saldo Pendiente</p>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-400 font-mono mt-1">L {totalPendiente.toFixed(2)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/40 p-1 rounded-lg overflow-x-auto border border-transparent dark:border-slate-800/50">
        {tabItems.map(t => (
          <button
            key={t.key}
            onClick={() => setFiltro(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              filtro === t.key
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              filtro === t.key
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                : 'bg-slate-200 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Receipt size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay registros en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-3 bg-[#ffffff] dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <div className="shrink-0">{getIcon(item)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.descripcion}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {parseDateOnly(item.fecha).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {getMonto(item)}
                {getBadge(item)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
