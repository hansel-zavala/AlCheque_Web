// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  // Verificar token secreto para seguridad
  const authHeader = req.headers.get('Authorization');
  const expectedToken = Deno.env.get('CRON_SECRET');
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  let generados = 0;
  let omitidos = 0;
  let errores = 0;

  // Obtener todos los servicios activos donde la fecha de próximo cobro ya llegó
  const { data: serviciosDebidos, error: fetchError } = await supabase
    .from('pacientes_servicios')
    .select(`
      id,
      paciente_id,
      servicio_id,
      fecha_proximo_cobro,
      company_id,
      servicios(nombre, costo_hnl, duracion_meses)
    `)
    .eq('activo', true)
    .lte('fecha_proximo_cobro', today);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  for (const ps of (serviciosDebidos ?? [])) {
    const servicio = (ps as any).servicios;

    // Verificar si ya existe una cuenta para este servicio en este período
    const { data: cuentaExistente } = await supabase
      .from('cuentas_por_cobrar')
      .select('id')
      .eq('paciente_id', ps.paciente_id)
      .eq('servicio_id', ps.servicio_id)
      .eq('fecha_vencimiento', ps.fecha_proximo_cobro)
      .eq('company_id', ps.company_id)
      .limit(1);

    if (cuentaExistente && cuentaExistente.length > 0) {
      // Ya existe — solo avanzar la fecha si no se ha hecho
      omitidos++;
      await supabase.from('log_automatizaciones').insert([{
        company_id: ps.company_id,
        tipo: 'cobro_mensual_automatico',
        paciente_id: ps.paciente_id,
        servicio_id: ps.servicio_id,
        resultado: 'omitido',
        detalle: 'Cuenta ya existente para este período',
      }]);
      continue;
    }

    // Crear la cuenta por cobrar
    const { data: nuevaCuenta, error: cuentaError } = await supabase
      .from('cuentas_por_cobrar')
      .insert([{
        paciente_id: ps.paciente_id,
        servicio_id: ps.servicio_id,
        monto_total: servicio?.costo_hnl ?? 0,
        subtotal: servicio?.costo_hnl ?? 0,
        fecha_vencimiento: ps.fecha_proximo_cobro,
        estado: 'al_dia',
        monto_pagado: 0,
        company_id: ps.company_id,
      }])
      .select()
      .single();

    if (cuentaError) {
      errores++;
      await supabase.from('log_automatizaciones').insert([{
        company_id: ps.company_id,
        tipo: 'cobro_mensual_automatico',
        paciente_id: ps.paciente_id,
        resultado: 'error',
        detalle: cuentaError.message,
      }]);
      continue;
    }

    // Avanzar fecha_proximo_cobro
    const meses = servicio?.duracion_meses ?? 1;
    const proxFecha = new Date(ps.fecha_proximo_cobro + 'T00:00:00');
    proxFecha.setMonth(proxFecha.getMonth() + meses);
    const proxFechaStr = proxFecha.toISOString().split('T')[0];

    await supabase.from('pacientes_servicios')
      .update({ fecha_proximo_cobro: proxFechaStr })
      .eq('id', ps.id);

    // Registrar en log
    await supabase.from('log_automatizaciones').insert([{
      company_id: ps.company_id,
      tipo: 'cobro_mensual_automatico',
      paciente_id: ps.paciente_id,
      servicio_id: ps.servicio_id,
      resultado: 'exitoso',
      detalle: `Cuenta generada. Próximo cobro: ${proxFechaStr}`,
      cuenta_generada_id: nuevaCuenta.id,
    }]);

    generados++;
  }

  return new Response(JSON.stringify({
    ok: true,
    resumen: { generados, omitidos, errores },
    ejecutado_en: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
