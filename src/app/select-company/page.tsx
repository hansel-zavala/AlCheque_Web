"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Building2, ChevronRight, X, Briefcase, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCompanyStore, Company } from '@/store/useCompanyStore';
import { createClient } from '@/utils/supabase/client';

export default function SelectCompanyPage() {
  const router = useRouter();
  const { setActiveCompany } = useCompanyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({ name: '', rfc: '', currency: 'HNL' });

  const [existingCompanies, setExistingCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCompanies() {
      // Obtenemos las empresas a las que el usuario tiene acceso
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          role,
          companies (
            id,
            name,
            rfc,
            currency
          )
        `);
      
      if (!error && data) {
        // Mapeamos la respuesta para que coincida con el store
        const formattedCompanies: Company[] = data.map((item: any) => ({
          id: item.companies.id,
          name: item.companies.name,
          rfc: item.companies.rfc,
          currency: item.companies.currency,
          role: item.role
        }));
        setExistingCompanies(formattedCompanies);
      }
      setLoading(false);
    }
    
    fetchCompanies();
  }, [supabase]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // API call to Supabase
    const { data: newCompanyDataRes, error } = await supabase
      .from('companies')
      .insert([
        { 
          name: newCompanyData.name, 
          rfc: newCompanyData.rfc, 
          currency: newCompanyData.currency 
        }
      ])
      .select()
      .single();

    if (error || !newCompanyDataRes) {
      console.error("Supabase Error:", error);
      alert("Error al crear la empresa. Detalles en la consola: " + (error?.message || ""));
      return;
    }
    
    const newCompany: Company = {
      id: newCompanyDataRes.id,
      name: newCompanyDataRes.name,
      rfc: newCompanyDataRes.rfc,
      currency: newCompanyDataRes.currency,
      role: 'owner' // Trigger in backend sets this
    };
    
    setActiveCompany(newCompany);
    setIsModalOpen(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-4">
      {/* Header / Brand */}
      <div className="mb-12 text-center animate-slide-up">
        <div className="bg-brand-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-apple">
          <Briefcase className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">Bienvenido a AlCheque</h1>
        <p className="text-foreground/60 max-w-sm mx-auto">
          Cree una nueva empresa o seleccione una existente para continuar.
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl bg-surface rounded-3xl shadow-apple overflow-hidden animate-slide-up border border-border/50">
        
        {/* Create New Action */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="group p-6 border-b border-border/50 hover:bg-brand-50/50 cursor-pointer transition-colors flex items-center gap-5"
        >
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground group-hover:text-brand-600 transition-colors">Nueva Empresa</h3>
            <p className="text-sm text-foreground/60">Cree un nuevo libro contable y empiece a administrar su negocio</p>
          </div>
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5 text-brand-500" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-surface/50">
            <div className="px-6 py-3 border-b border-border/50 bg-background/50">
              <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Tus Empresas</h4>
            </div>
            
            <div className="divide-y divide-border/30">
              {existingCompanies.length === 0 ? (
                <div className="p-8 text-center text-foreground/50">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aún no tienes ninguna empresa.</p>
                  <p className="text-sm">Crea una nueva para comenzar.</p>
                </div>
              ) : (
                existingCompanies.map((company) => (
                  <div 
                    key={company.id} 
                    className="p-6 hover:bg-background/80 cursor-pointer transition-colors flex items-center gap-5 group"
                    onClick={() => {
                      setActiveCompany({
                        id: company.id,
                        name: company.name,
                        currency: company.currency,
                        role: company.role
                      });
                      router.push('/');
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-border/30 text-foreground/70 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-foreground">{company.name}</h3>
                        <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium border border-brand-200">
                          {company.role === 'owner' ? 'Dueño' : company.role}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/50">Moneda Base: {company.currency}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <span className="text-sm text-brand-600 font-medium">Entrar</span>
                      <ChevronRight className="w-5 h-5 text-brand-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="mt-12 text-sm text-foreground/40">
        Gestión Multi-empresa de AlCheque • Protegido y cifrado
      </p>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold">Crear Nueva Empresa</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-foreground/50 hover:text-foreground transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="p-6">
              <div className="space-y-5">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Nombre del Negocio</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-foreground/40" />
                    </div>
                    <input 
                      type="text" 
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-background/50 text-foreground transition-all" 
                      placeholder="Ej. Mi Consultorio Médico"
                      value={newCompanyData.name}
                      onChange={(e) => setNewCompanyData({...newCompanyData, name: e.target.value})}
                    />
                  </div>
                </div>

                {/* RFC */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">RFC / Identificación Fiscal <span className="text-foreground/40 font-normal">(Opcional)</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-foreground/40" />
                    </div>
                    <input 
                      type="text" 
                      className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-background/50 text-foreground transition-all" 
                      placeholder="Ej. ABCD123456789"
                      value={newCompanyData.rfc}
                      onChange={(e) => setNewCompanyData({...newCompanyData, rfc: e.target.value})}
                    />
                  </div>
                </div>

                {/* Moneda */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Moneda Base</label>
                  <select 
                    className="block w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-background/50 text-foreground transition-all"
                    value={newCompanyData.currency}
                    onChange={(e) => setNewCompanyData({...newCompanyData, currency: e.target.value})}
                  >
                    <option value="HNL">Lempira (HNL)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                  <p className="mt-2 text-xs text-foreground/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                    La moneda no se podrá cambiar después de crear la empresa.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-border/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground bg-transparent hover:bg-background rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-sm"
                >
                  Crear Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
