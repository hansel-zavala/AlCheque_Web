'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: 'Credenciales inválidas o correo no registrado.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        nombre: 'Nuevo Usuario',
      }
    }
  }

  const { error, data: authData } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // Insert profile manually since triggers might not be set up yet for testing
  if (authData.user) {
    const { error: insertError } = await supabase.from('users').insert([{
      id: authData.user.id,
      email: data.email,
      nombre: 'Nuevo Usuario',
      rol: 'administrador', // Default to admin for dev testing
      activo: true
    }])
    if (insertError) {
      console.error('Error insertando perfil:', insertError)
    }
  }

  if (!authData.session) {
    return { error: 'Registro exitoso. Por favor revisa tu correo (o SPAM) para confirmar la cuenta, o ve a Supabase > Authentication > Providers > Email y desactiva "Confirm email" para pruebas.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
