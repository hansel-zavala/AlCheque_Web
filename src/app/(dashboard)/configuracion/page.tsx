'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

// Tipos base según esquema
type Categoria = {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'egreso';
  activa: boolean;
};

// Datos iniciales de ejemplo
const mockCategorias: Categoria[] = [
  { id: '1', nombre: 'Mensualidades y Paquetes', tipo: 'ingreso', activa: true },
  { id: '2', nombre: 'Donaciones y Patrocinios', tipo: 'ingreso', activa: true },
  { id: '3', nombre: 'Pago de Terapeutas', tipo: 'egreso', activa: true },
  { id: '4', nombre: 'Servicios Básicos (Agua, Luz)', tipo: 'egreso', activa: true },
];

export default function CategoriasPage() {
  const [categorias] = useState<Categoria[]>(mockCategorias);
  const [filter, setFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos');

  const filteredCategorias = categorias.filter(c => filter === 'todos' || c.tipo === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
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
        
        <button className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
          <Plus size={18} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th className="p-4 font-medium">Nombre de la Categoría</th>
              <th className="p-4 font-medium w-32">Tipo</th>
              <th className="p-4 font-medium w-24">Estado</th>
              <th className="p-4 font-medium w-32 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCategorias.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50 transition-colors group">
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
                  <button className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-md hover:bg-brand-50" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50" title="Desactivar">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCategorias.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No se encontraron categorías.
          </div>
        )}
      </div>
    </div>
  );
}
