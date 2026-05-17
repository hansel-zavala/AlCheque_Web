import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, User, Users, BriefcaseMedical, Loader2, Save, Plus, Trash2, History, GraduationCap } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { formatLocalDateInputValue, parseDateOnly } from '@/utils/date';
import { useCompanyStore } from '@/store/useCompanyStore';
import { PacienteHistorial } from '@/components/PacienteHistorial';
import { PacienteMatricula } from '@/components/PacienteMatricula';

type ServicioCatalogo = { id: string; nombre: string; costo_hnl: number; duracion_meses: number };

type PacienteRow = {
  id: string;
  codigo_interno: string | null;
  nombre_completo: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  grado_escolar: string | null;
  nombre_tutor: string | null;
  telefono_tutor: string | null;
  email_tutor: string | null;
  relacion_tutor: string | null;
};

type ServicioAsignadoRow = {
  id: string;
  servicio_id: string;
  fecha_inicio: string;
  fecha_proximo_cobro: string;
  servicios: { nombre: string | null; costo_hnl: number | null } | null;
};

type PacienteDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: string | null;
  onSuccess: () => void;
};

export function PacienteDrawer({ isOpen, onClose, pacienteId, onSuccess }: PacienteDrawerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'servicios' | 'matricula' | 'historial'>('perfil');
  const { activeCompany } = useCompanyStore();

  // Datos Estudiante
  const [codigoInterno, setCodigoInterno] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [gradoEscolar, setGradoEscolar] = useState('');

  // Datos Tutor
  const [nombreTutor, setNombreTutor] = useState('');
  const [telefonoTutor, setTelefonoTutor] = useState('');
  const [emailTutor, setEmailTutor] = useState('');
  const [relacionTutor, setRelacionTutor] = useState('Madre');

  // Servicios
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioCatalogo[]>([]);
  const [serviciosAsignados, setServiciosAsignados] = useState<ServicioAsignadoRow[]>([]);
  const [nuevoServicioId, setNuevoServicioId] = useState('');
  const [fechaInicioServicio, setFechaInicioServicio] = useState(formatLocalDateInputValue());
  const [cobroInicialPagado, setCobroInicialPagado] = useState(false);

  const resetForm = useCallback(() => {
    setCodigoInterno(''); setNombreCompleto(''); setFechaNacimiento(''); setGenero('Masculino'); setGradoEscolar('');
    setNombreTutor(''); setTelefonoTutor(''); setEmailTutor(''); setRelacionTutor('Madre');
    setActiveTab('perfil');
    setServiciosAsignados([]);
    setCobroInicialPagado(false);
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!activeCompany) return;
    const { data } = await supabase
      .from('servicios')
      .select('id, nombre, costo_hnl, duracion_meses')
      .eq('company_id', activeCompany.id)
      .eq('activo', true)
      .returns<ServicioCatalogo[]>();
    if (data) setServiciosCatalogo(data);
  }, [supabase, activeCompany]);

  const loadPaciente = useCallback(async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('pacientes')
      .select('id, codigo_interno, nombre_completo, fecha_nacimiento, genero, grado_escolar, nombre_tutor, telefono_tutor, email_tutor, relacion_tutor')
      .eq('id', id)
      .single()
      .returns<PacienteRow>();
    if (data) {
      setCodigoInterno(data.codigo_interno || '');
      setNombreCompleto(data.nombre_completo || '');
      setFechaNacimiento(data.fecha_nacimiento || '');
      setGenero(data.genero || 'Masculino');
      setGradoEscolar(data.grado_escolar || '');
      setNombreTutor(data.nombre_tutor || '');
      setTelefonoTutor(data.telefono_tutor || '');
      setEmailTutor(data.email_tutor || '');
      setRelacionTutor(data.relacion_tutor || 'Madre');
    }
    setLoading(false);
  }, [supabase]);

  const loadServiciosAsignados = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('pacientes_servicios')
      .select('*, servicios(nombre, costo_hnl)')
      .eq('paciente_id', id)
      .eq('activo', true)
      .returns<ServicioAsignadoRow[]>();
    if (data) setServiciosAsignados(data);
  }, [supabase]);

  useEffect(() => {
    if (!isOpen) return;

    if (pacienteId) {
      loadPaciente(pacienteId);
      loadServiciosAsignados(pacienteId);
    } else {
      resetForm();
    }
    loadCatalog();
  }, [isOpen, pacienteId, loadPaciente, loadServiciosAsignados, loadCatalog, resetForm]);

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      codigo_interno: codigoInterno,
      nombre_completo: nombreCompleto,
      fecha_nacimiento: fechaNacimiento || null,
      genero,
      grado_escolar: gradoEscolar,
      nombre_tutor: nombreTutor,
      telefono_tutor: telefonoTutor,
      email_tutor: emailTutor,
      relacion_tutor: relacionTutor,
      // Para retrocompatibilidad con esquema inicial
      tarifa_mensual: 0,
      activo: true,
      company_id: activeCompany?.id
    };

    if (pacienteId) {
      await supabase.from('pacientes').update(payload).eq('id', pacienteId);
      alert('Perfil actualizado');
      onSuccess();
    } else {
      const { data, error } = await supabase.from('pacientes').insert([payload]).select().single();
      if (error) {
        alert('Error: ' + error.message);
      } else if (data) {
        alert('Paciente creado exitosamente. Ahora puedes asignarle servicios.');
        onSuccess();
        // Cambiar a modo edición de este nuevo paciente para poder agregarle servicios
        loadPaciente(data.id);
        setActiveTab('servicios');
      }
    }
    setSaving(false);
  };

  const handleAssignService = async () => {
    if (!pacienteId || !nuevoServicioId) return;
    setSaving(true);
    
    const selectedService = serviciosCatalogo.find(s => s.id === nuevoServicioId);
    const monthsToAdd = selectedService?.duracion_meses ?? 1;

    // Calcular próxima fecha de cobro sumando los meses correspondientes usando la zona local
    const nextDate = parseDateOnly(fechaInicioServicio);
    if (monthsToAdd > 0) {
      nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
    }

    const { error } = await supabase.from('pacientes_servicios').insert([{
      paciente_id: pacienteId,
      servicio_id: nuevoServicioId,
      fecha_inicio: fechaInicioServicio,
      fecha_proximo_cobro: formatLocalDateInputValue(nextDate),
      activo: true,
      company_id: activeCompany?.id
    }]);

    if (!error) {
      if (cobroInicialPagado) {
        // Crear cuenta por cobrar pagada
        const { data: cuenta } = await supabase.from('cuentas_por_cobrar').insert([{
          paciente_id: pacienteId,
          servicio_id: nuevoServicioId,
          monto_total: selectedService?.costo_hnl || 0,
          subtotal: selectedService?.costo_hnl || 0,
          fecha_vencimiento: fechaInicioServicio,
          estado: 'pagada',
          monto_pagado: selectedService?.costo_hnl || 0,
          company_id: activeCompany?.id
        }]).select().single();

        if (cuenta) {
          // Crear abono
          await supabase.from('abonos').insert([{
            cuenta_id: cuenta.id,
            monto: selectedService?.costo_hnl || 0,
            fecha: fechaInicioServicio,
            metodo_pago: 'efectivo',
            company_id: activeCompany?.id
          }]);

          // Buscar categoría "Cobro de Servicios"
          const { data: catData } = await supabase
            .from('categorias')
            .select('id')
            .eq('nombre', 'Cobro de Servicios')
            .eq('tipo', 'ingreso')
            .eq('company_id', activeCompany?.id)
            .limit(1);
          
          let catId = catData?.[0]?.id;
          if (!catId) {
            const { data: newCat } = await supabase.from('categorias').insert([{ 
              nombre: 'Cobro de Servicios', tipo: 'ingreso', company_id: activeCompany?.id 
            }]).select().single();
            catId = newCat?.id;
          }

          // Crear transacción
          await supabase.from('transacciones').insert([{
            tipo: 'ingreso',
            monto_hnl: selectedService?.costo_hnl || 0,
            fecha: fechaInicioServicio,
            descripcion: `Cobro Adelantado: ${nombreCompleto} - ${selectedService?.nombre}`,
            categoria_id: catId,
            metodo_pago: 'efectivo',
            estado: 'pagado',
            company_id: activeCompany?.id
          }]);
        }
      }

      setNuevoServicioId('');
      setCobroInicialPagado(false);
      loadServiciosAsignados(pacienteId);
    } else {
      alert(error.message);
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-left overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {pacienteId ? 'Perfil del Paciente' : 'Nuevo Paciente'}
            </h2>
            <p className="text-sm text-slate-500">
              {pacienteId ? nombreCompleto : 'Completa los datos para registrar'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {pacienteId && (
          <div className="flex border-b border-border px-2 shrink-0 bg-white overflow-x-auto">
            {([
              { key: 'perfil', icon: <User size={15}/>, label: 'Datos' },
              { key: 'servicios', icon: <BriefcaseMedical size={15}/>, label: 'Servicios' },
              { key: 'matricula', icon: <GraduationCap size={15}/>, label: 'Matrícula' },
              { key: 'historial', icon: <History size={15}/>, label: 'Historial' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
          ) : activeTab === 'matricula' && pacienteId ? (
            <PacienteMatricula pacienteId={pacienteId} />
          ) : activeTab === 'historial' && pacienteId ? (
            <PacienteHistorial pacienteId={pacienteId} nombrePaciente={nombreCompleto} />
          ) : activeTab === 'perfil' ? (
            <form id="perfilForm" onSubmit={handleSavePerfil} className="space-y-8">
              
              <section>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} className="text-brand-500"/> Datos del Estudiante
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Código Interno *</label>
                    <input type="text" required value={codigoInterno} onChange={e=>setCodigoInterno(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" placeholder="Ej. EXP-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo *</label>
                    <input type="text" required value={nombreCompleto} onChange={e=>setNombreCompleto(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Nacimiento</label>
                    <input type="date" value={fechaNacimiento} onChange={e=>setFechaNacimiento(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Género</label>
                    <select value={genero} onChange={e=>setGenero(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20">
                      <option>Masculino</option><option>Femenino</option><option>Otro</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Grado Escolar / Nivel</label>
                    <input type="text" value={gradoEscolar} onChange={e=>setGradoEscolar(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" placeholder="Ej. 3er Grado" />
                  </div>
                </div>
              </section>

              <hr className="border-slate-200" />

              <section>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users size={16} className="text-brand-500"/> Datos del Padre o Tutor
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del Tutor *</label>
                    <input type="text" required value={nombreTutor} onChange={e=>setNombreTutor(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Relación</label>
                    <select value={relacionTutor} onChange={e=>setRelacionTutor(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20">
                      <option>Madre</option><option>Padre</option><option>Abuelo(a)</option><option>Tutor Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono Móvil</label>
                    <input type="tel" value={telefonoTutor} onChange={e=>setTelefonoTutor(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Correo Electrónico (Facturas y Alertas)</label>
                    <input type="email" value={emailTutor} onChange={e=>setEmailTutor(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                </div>
              </section>

            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-brand-800 mb-1 uppercase tracking-wider">Asignar Nuevo Servicio</label>
                  <select value={nuevoServicioId} onChange={e=>setNuevoServicioId(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-brand-200 bg-white text-sm text-slate-700">
                    <option value="">-- Selecciona un servicio del catálogo --</option>
                    {serviciosCatalogo.map(s => <option key={s.id} value={s.id}>{s.nombre} (L {s.costo_hnl})</option>)}
                  </select>
                </div>
                <div className="w-40">
                  <label className="block text-xs font-medium text-brand-700 mb-1">Fecha de Inicio</label>
                  <input type="date" value={fechaInicioServicio} onChange={e=>setFechaInicioServicio(e.target.value)} className="px-3 py-2 w-full rounded-lg border border-brand-200 bg-white text-sm" />
                </div>
                <button onClick={handleAssignService} disabled={!nuevoServicioId || saving} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 h-9">
                  <Plus size={16}/> Agregar
                </button>
              </div>
              {nuevoServicioId && (
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" id="cobro_inicial" checked={cobroInicialPagado} onChange={e=>setCobroInicialPagado(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500 border-slate-300 w-4 h-4"/>
                  <label htmlFor="cobro_inicial" className="text-sm font-medium text-slate-700 cursor-pointer">El paciente está pagando el primer ciclo hoy (Generar cobro e ingreso automáticamente)</label>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Servicios Actualmente Asignados</h4>
                <div className="space-y-3">
                  {serviciosAsignados.length === 0 ? (
                    <p className="text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-slate-100 text-center">No tiene ningún servicio asignado.</p>
                  ) : (
                    serviciosAsignados.map(ps => {
                      const isDue = new Date(ps.fecha_proximo_cobro) <= new Date();
                      return (
                        <div key={ps.id} className={`bg-white p-4 rounded-xl border ${isDue ? 'border-orange-300 shadow-sm' : 'border-slate-200 shadow-sm'} flex justify-between items-center transition-all`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800">{ps.servicios?.nombre}</p>
                              {isDue && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Por Cobrar</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">Cobro programado: L {ps.servicios?.costo_hnl}</p>
                            <p className={`text-xs font-medium mt-1 ${isDue ? 'text-orange-600' : 'text-brand-600'}`}>Siguiente cobro: {parseDateOnly(ps.fecha_proximo_cobro).toLocaleDateString('es-HN')}</p>
                            
                            {isDue && (
                              <button 
                                onClick={async () => {
                                  if(!confirm('¿Generar nueva cuenta por cobrar para este servicio?')) return;
                                  setSaving(true);
                                  
                                  // Generar Cuenta
                                  await supabase.from('cuentas_por_cobrar').insert([{
                                    paciente_id: pacienteId,
                                    servicio_id: ps.servicio_id,
                                    monto_total: ps.servicios?.costo_hnl,
                                    subtotal: ps.servicios?.costo_hnl,
                                    fecha_vencimiento: ps.fecha_proximo_cobro,
                                    estado: 'al_dia',
                                    monto_pagado: 0,
                                    company_id: activeCompany?.id
                                  }]);

                                  // Actualizar próxima fecha (Usa la duración del servicio)
                                  const s = serviciosCatalogo.find(srv => srv.id === ps.servicio_id);
                                  const monthsToAdd = s?.duracion_meses ?? 1;
                                  const nextD = parseDateOnly(ps.fecha_proximo_cobro);
                                  if (monthsToAdd > 0) {
                                    nextD.setMonth(nextD.getMonth() + monthsToAdd);
                                  }
                                  await supabase.from('pacientes_servicios').update({
                                    fecha_proximo_cobro: formatLocalDateInputValue(nextD)
                                  }).eq('id', ps.id);

                                  alert('Cuenta generada exitosamente. Se ha actualizado la próxima fecha de cobro.');
                                  loadServiciosAsignados(pacienteId!);
                                  setSaving(false);
                                }}
                                className="mt-3 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                              >
                                Emitir Cobro y Renovar
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={async () => {
                              if(confirm('¿Eliminar este servicio del paciente?')) {
                                await supabase.from('pacientes_servicios').delete().eq('id', ps.id);
                                loadServiciosAsignados(pacienteId!);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors self-start"
                          >
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-white flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            Cerrar
          </button>
          {activeTab === 'perfil' && (
            <button 
              type="submit" form="perfilForm" disabled={saving}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Perfil
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
