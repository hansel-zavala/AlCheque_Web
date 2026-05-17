'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building2, Save, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCompanyStore } from '@/store/useCompanyStore';

export default function PerfilCentroPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeCompany, setActiveCompany } = useCompanyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    monedaPrincipal: 'HNL'
  });

  useEffect(() => {
    async function fetchCompany() {
      if (!activeCompany) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('name, currency, email, phone, address')
        .eq('id', activeCompany.id)
        .single();
      
      if (data && !error) {
        setFormData({
          nombre: data.name || '',
          email: data.email || '',
          telefono: data.phone || '',
          direccion: data.address || '',
          monedaPrincipal: data.currency || 'HNL'
        });
      }
      setLoading(false);
    }
    fetchCompany();
  }, [activeCompany, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('companies')
      .update({
        name: formData.nombre,
        email: formData.email,
        phone: formData.telefono,
        address: formData.direccion,
        currency: formData.monedaPrincipal
      })
      .eq('id', activeCompany.id);

    if (!error) {
      // Update global state so sidebar reflects changes instantly
      setActiveCompany({
        ...activeCompany,
        name: formData.nombre,
        currency: formData.monedaPrincipal
      });
      alert('Perfil del centro actualizado correctamente');
    } else {
      alert('Error al guardar: ' + error.message);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Perfil del Centro</h2>
        <p className="text-slate-500 mt-1 text-sm">Administra la información pública y configuración general de tu institución.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Logo y Nombre */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="w-24 h-24 bg-brand-50 rounded-2xl border-2 border-brand-100 flex items-center justify-center shrink-0">
              <Building2 size={40} className="text-brand-500" />
            </div>
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Institución *</label>
                <input 
                  type="text" 
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="px-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Datos de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Principal</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.telefono}
                  onChange={e => setFormData({...formData, telefono: e.target.value})}
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Física</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                <textarea 
                  rows={2}
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700 resize-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Configuración Financiera */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-4">Configuración Financiera</h3>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda Principal por Defecto</label>
              <select 
                value={formData.monedaPrincipal}
                onChange={e => setFormData({...formData, monedaPrincipal: e.target.value})}
                className="px-4 py-2 w-full rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
              >
                <option value="HNL">Lempiras (HNL)</option>
                <option value="USD">Dólares Estadounidenses (USD)</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">Esta es la moneda que aparecerá preseleccionada al crear nuevas transacciones o cuentas.</p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-slate-50 flex justify-end">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
