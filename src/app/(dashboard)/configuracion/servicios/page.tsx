'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Check, X, Calendar, DollarSign } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Servicio = {
  id: string;
  nombre: string;
  costo_hnl: number;
  duracion_meses: number;
  activo: boolean;
};

export default function ServiciosCatalogPage() {
  const supabase = createClient();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [costo, setCosto] = useState('');
  const [duracion, setDuracion] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCosto, setEditCosto] = useState('');
  const [editDuracion, setEditDuracion] = useState('1');

  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        setErrorMsg('La tabla "servicios" no existe. Asegúrate de correr el código SQL en Supabase.');
      } else {
        setErrorMsg(`Error: ${error.message}`);
      }
    } else if (data) {
      setServicios(data);
    }
    setLoading(false);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !costo) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      nombre,
      costo_hnl: parseFloat(costo),
      duracion_meses: parseInt(duracion),
      activo: true
    };

    const { data, error } = await supabase
      .from('servicios')
      .insert([payload])
      .select();

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(`Error creando servicio: ${error.message}`);
    } else if (data) {
      setShowForm(false);
      setNombre('');
      setCosto('');
      setDuracion('1');
      setServicios([...servicios, data[0]]);
    }
  };

  const handleToggleActivo = async (s: Servicio) => {
    const nuevoEstado = !s.activo;
    setServicios(servicios.map(x => x.id === s.id ? { ...x, activo: nuevoEstado } : x));
    const { error } = await supabase.from('servicios').update({ activo: nuevoEstado }).eq('id', s.id);
    if (error) {
      setServicios(servicios.map(x => x.id === s.id ? { ...x, activo: s.activo } : x));
      setErrorMsg(`Error al actualizar estado: ${error.message}`);
    }
  };

  const handleEditClick = (s: Servicio) => {
    setEditingId(s.id);
    setEditNombre(s.nombre);
    setEditCosto(s.costo_hnl.toString());
    setEditDuracion(s.duracion_meses.toString());
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim() || !editingId || !editCosto) return;

    const { error } = await supabase
      .from('servicios')
      .update({
        nombre: editNombre,
        costo_hnl: parseFloat(editCosto),
        duracion_meses: parseInt(editDuracion)
      })
      .eq('id', editingId);

    if (error) {
      setErrorMsg(`Error al actualizar: ${error.message}`);
    } else {
      setServicios(servicios.map(x => 
        x.id === editingId ? { ...x, nombre: editNombre, costo_hnl: parseFloat(editCosto), duracion_meses: parseInt(editDuracion) } : x
      ));
      setEditingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Servicios</h2>
        <p className="text-slate-500 mt-1 text-sm">Crea los servicios que ofreces, sus precios y duraciones para asignarlos a los pacientes.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center space-x-3 border border-red-200 shadow-sm animate-fade-in">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>{showForm ? 'Cancelar' : 'Nuevo Servicio'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCrear} className="bg-surface p-6 rounded-2xl border border-brand-200 shadow-md animate-slide-up space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio *</label>
              <input 
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Colegiatura Mensual" 
                className="px-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Costo (HNL) *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" step="0.01" required min="0" value={costo} onChange={(e) => setCosto(e.target.value)}
                  placeholder="0.00" 
                  className="pl-9 pr-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duración del cobro *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={duracion} onChange={(e) => setDuracion(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  <option value="1">Mensual (1 mes)</option>
                  <option value="3">Trimestral (3 meses)</option>
                  <option value="6">Semestral (6 meses)</option>
                  <option value="12">Anual (12 meses)</option>
                  <option value="0">Pago Único (No vence)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit" disabled={isSubmitting}
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center h-10 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Servicio'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-medium">Servicio</th>
              <th className="p-4 font-medium w-32 text-right">Costo (HNL)</th>
              <th className="p-4 font-medium w-32">Ciclo</th>
              <th className="p-4 font-medium w-24">Estado</th>
              <th className="p-4 font-medium w-32 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  Cargando...
                </td>
              </tr>
            ) : servicios.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No se encontraron servicios registrados en el catálogo.
                </td>
              </tr>
            ) : (
              servicios.map((s) => (
                <tr key={s.id} className={`transition-colors group ${s.activo ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-70'}`}>
                  {editingId === s.id ? (
                    <td colSpan={5} className="p-2">
                      <form onSubmit={handleUpdate} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white p-2 rounded-xl border border-brand-200 shadow-sm">
                        <input 
                          type="text" required value={editNombre} onChange={(e) => setEditNombre(e.target.value)}
                          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                        />
                        <div className="relative w-32">
                          <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="number" step="0.01" required min="0" value={editCosto} onChange={(e) => setEditCosto(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-mono"
                          />
                        </div>
                        <select 
                          value={editDuracion} onChange={(e) => setEditDuracion(e.target.value)}
                          className="w-32 px-3 py-1.5 rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                        >
                          <option value="1">Mensual</option>
                          <option value="3">Trimestral</option>
                          <option value="6">Semestral</option>
                          <option value="12">Anual</option>
                          <option value="0">Único</option>
                        </select>
                        <div className="flex items-center space-x-1 ml-auto">
                          <button type="submit" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Guardar"><Check size={18} /></button>
                          <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Cancelar"><X size={18} /></button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="p-4 font-medium text-slate-800">{s.nombre}</td>
                      <td className="p-4 text-right font-mono font-medium text-slate-700">L {s.costo_hnl.toFixed(2)}</td>
                      <td className="p-4">
                        <span className="text-sm text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {s.duracion_meses === 0 ? 'Pago Único' : s.duracion_meses === 1 ? 'Mensual' : s.duracion_meses === 12 ? 'Anual' : `${s.duracion_meses} meses`}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.activo ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleEditClick(s)} className="text-slate-400 hover:text-brand-600 transition-colors p-1.5 rounded-lg hover:bg-brand-50" title="Editar"><Edit2 size={16} /></button>
                        <button onClick={() => handleToggleActivo(s)} className={`transition-colors p-1.5 rounded-lg ${s.activo ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-400 hover:bg-green-50 hover:text-green-600'}`} title={s.activo ? "Desactivar" : "Activar"}><Trash2 size={16} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
