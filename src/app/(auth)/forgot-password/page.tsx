'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resetPassword } from './actions';
import Link from 'next/link';

const initialState = {
  error: '',
  success: ''
};

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
    >
      {pending ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(resetPassword, initialState);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-xl border border-border animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-brand-600">Recuperar Contraseña</h1>
          <p className="text-sm text-gray-500 mt-2">Ingresa tu correo y te enviaremos instrucciones</p>
        </div>
        
        <form action={formAction} className="space-y-4 pt-4">
          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {state.error}
            </div>
          )}
          
          {state?.success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
              {state.success}
            </div>
          )}
          
          {!state?.success && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="usuario@centro.com"
                />
              </div>
              <SubmitButton />
            </>
          )}

          <div className="pt-4 text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">
              Volver al Inicio de Sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
