'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCompanyStore } from '@/store/useCompanyStore';

type Categoria = {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'egreso';
  activa: boolean;
};

export default function CategoriasPage() {
  const supabase = createClient();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filter, setFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para el formulario de crear
  const [showForm, setShowForm] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatTipo, setNuevaCatTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para edición inline
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatNombre, setEditCatNombre] = useState('');
  const [editCatTipo, setEditCatTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const { activeCompany } = useCompanyStore();

  const fetchCategorias = async () => {
    if (!activeCompany) return;
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('company_id', activeCompany.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error(error);
      if (error.code === '42P01') {
        setErrorMsg('La tabla "categorias" no existe en Supabase. Debes correr el script SQL primero.');
      } else {
        setErrorMsg(`Error consultando base de datos: ${error.message}`);
      }
    } else if (data) {
      setCategorias(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategorias();
  }, [activeCompany]);

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCatNombre.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nombre: nuevaCatNombre, tipo: nuevaCatTipo, activa: true, company_id: activeCompany?.id }])
      .select();

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setErrorMsg(`Error creando categoría: ${error.message}. (Asegúrate de haber desactivado RLS para pruebas o haber iniciado sesión)`);
    } else {
      setShowForm(false);
      setNuevaCatNombre('');
      if (data) setCategorias([...categorias, data[0]]);
    }
  };

  const handleToggleEstado = async (cat: Categoria) => {
    setErrorMsg('');
    const nuevoEstado = !cat.activa;
    
    // Actualizar localmente rápido (Optimistic UI)
    setCategorias(categorias.map(c => c.id === cat.id ? { ...c, activa: nuevoEstado } : c));

    const { error } = await supabase
      .from('categorias')
      .update({ activa: nuevoEstado })
      .eq('id', cat.id);

    if (error) {
      setErrorMsg(`Error actualizando: ${error.message}`);
      // Revertir en caso de error
      setCategorias(categorias.map(c => c.id === cat.id ? { ...c, activa: cat.activa } : c));
    }
  };

  const handleEditClick = async (cat: Categoria) => {
    setErrorMsg('');
    
    // 1. Verificar si existen transacciones asociadas a esta categoría
    const { count, error } = await supabase
      .from('transacciones')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', cat.id);

    if (error) {
      setErrorMsg(`Error verificando historial: ${error.message}`);
      return;
    }

    // 2. Si existe al menos 1 transacción, bloqueamos la edición
    if (count && count > 0) {
      setErrorMsg(`Bloqueo de seguridad: No puedes editar "${cat.nombre}" porque ya tiene transacción(es) histórica(s). Por favor desactívala y crea una nueva para no alterar el historial contable.`);
      return;
    }

    // 3. Si está limpia (count = 0), permitimos la edición inline
    setEditingCatId(cat.id);
    setEditCatNombre(cat.nombre);
    setEditCatTipo(cat.tipo);
  };

  const handleUpdateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCatNombre.trim() || !editingCatId) return;

    setErrorMsg('');
    const { error } = await supabase
      .from('categorias')
      .update({ nombre: editCatNombre, tipo: editCatTipo })
      .eq('id', editingCatId);

    if (error) {
      setErrorMsg(`Error actualizando categoría: ${error.message}`);
    } else {
      setCategorias(categorias.map(c => 
        c.id === editingCatId ? { ...c, nombre: editCatNombre, tipo: editCatTipo } : c
      ));
      setEditingCatId(null);
    }
  };

  const filteredCategorias = categorias.filter(c => filter === 'todos' || c.tipo === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center space-x-3 border border-red-200 shadow-sm animate-fade-in">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface p-4 rounded-xl shadow-sm border border-border gap-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'todos' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter('ingreso')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ingreso' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Ingresos
          </button>
          <button 
            onClick={() => setFilter('egreso')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'egreso' ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Egresos
          </button>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>{showForm ? 'Cancelar' : 'Nueva Categoría'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCrearCategoria} className="bg-surface p-6 rounded-xl border border-brand-200 shadow-md animate-slide-up flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Categoría</label>
            <input 
              type="text" 
              required
              value={nuevaCatNombre}
              onChange={(e) => setNuevaCatNombre(e.target.value)}
              placeholder="Ej. Colegiaturas, Sueldos..." 
              className="px-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select 
              value={nuevaCatTipo}
              onChange={(e) => setNuevaCatTipo(e.target.value as 'ingreso'|'egreso')}
              className="px-4 py-2 w-full rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors flex justify-center items-center h-10 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Guardar'}
          </button>
        </form>
      )}

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 text-sm">
              <th className="p-4 font-medium">Nombre de la Categoría</th>
              <th className="p-4 font-medium w-32">Tipo</th>
              <th className="p-4 font-medium w-24">Estado</th>
              <th className="p-4 font-medium w-32 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  Cargando desde Supabase...
                </td>
              </tr>
            ) : filteredCategorias.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No se encontraron categorías registradas.
                </td>
              </tr>
            ) : (
              filteredCategorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors group">
                  {editingCatId === cat.id ? (
                    <td colSpan={4} className="p-2">
                      <form onSubmit={handleUpdateCategoria} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-brand-200 shadow-sm">
                        <input 
                          type="text" 
                          required
                          value={editCatNombre}
                          onChange={(e) => setEditCatNombre(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-md border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                        />
                        <select 
                          value={editCatTipo}
                          onChange={(e) => setEditCatTipo(e.target.value as 'ingreso'|'egreso')}
                          className="w-32 px-3 py-1.5 rounded-md border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                        >
                          <option value="ingreso">Ingreso</option>
                          <option value="egreso">Egreso</option>
                        </select>
                        <div className="flex items-center space-x-1 ml-auto">
                          <button type="submit" className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Guardar Cambios">
                            <Check size={18} />
                          </button>
                          <button type="button" onClick={() => setEditingCatId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors" title="Cancelar">
                            <X size={18} />
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="p-4 font-medium text-slate-800">{cat.nombre}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${cat.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        `}>
                          {cat.tipo}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${cat.activa ? 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-slate-400'}
                        `}>
                          {cat.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => handleEditClick(cat)}
                          className="text-slate-400 hover:text-brand-600 transition-colors p-1.5 rounded-md hover:bg-brand-50" 
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleEstado(cat)}
                          className={`transition-colors p-1.5 rounded-md ${cat.activa ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-400 hover:bg-green-50 hover:text-green-600'}`} 
                          title={cat.activa ? "Desactivar" : "Activar"}
                        >
                          <Trash2 size={16} />
                        </button>
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
