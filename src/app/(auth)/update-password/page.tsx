'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updatePassword } from './actions';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const initialState = {
  error: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
    >
      {pending ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
    </button>
  );
}

export default function UpdatePasswordPage() {
  const [state, formAction] = useFormState(updatePassword, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-xl border border-border animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-brand-600">Crear Nueva Contraseña</h1>
          <p className="text-sm text-gray-500 mt-2">Ingresa tu nueva contraseña para el sistema</p>
        </div>
        
        <form action={formAction} className="space-y-4 pt-4">
          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {state.error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Nueva Contraseña</label>
            <div className="relative">
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-4 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="••••••••"
                minLength={6}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <input 
                name="confirmPassword"
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-4 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
