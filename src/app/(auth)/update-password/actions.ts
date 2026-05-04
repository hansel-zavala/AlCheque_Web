'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

type UpdatePasswordState = { error: string };

export async function updatePassword(_prevState: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Por favor, llena todos los campos.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const supabase = createClient()

  // Actualiza la contraseña del usuario actualmente autenticado (la sesión se establece vía el enlace de reset)
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: 'Error al actualizar la contraseña: ' + error.message }
  }

  // Redirigir al login o al dashboard después de cambiarla
  redirect('/')
}
