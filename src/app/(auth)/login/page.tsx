'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

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
      {pending ? 'Autorizando...' : 'Iniciar Sesión'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-xl border border-border animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand-600">AlCheque</h1>
          <p className="text-sm text-gray-500 mt-2">Centro de Educación Especial</p>
        </div>
        
        <form action={formAction} className="space-y-4 pt-4">
          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {state.error}
            </div>
          )}
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Contraseña</label>
              <Link href="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-4 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="••••••••"
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
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
