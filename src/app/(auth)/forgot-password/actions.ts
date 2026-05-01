'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Por favor, ingresa tu correo electrónico.' }
  }

  const supabase = createClient()

  // Envía el enlace de recuperación (ajusta tu URL base en Supabase o en el objeto options)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/update-password`,
  })

  if (error) {
    // Es buena práctica no revelar si el correo existe o no por seguridad, 
    // pero para uso interno puedes mostrar error.
    return { error: 'Hubo un error al enviar el correo. Verifica tu dirección.' }
  }

  return { success: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' }
}
