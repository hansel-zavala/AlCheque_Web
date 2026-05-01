'use client';

import { useState } from 'react';
import { login, signup } from './actions';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setErrorMsg('');
    
    let result;
    if (isLogin) {
      result = await login(formData);
    } else {
      result = await signup(formData);
    }

    if (result?.error) {
      setErrorMsg(result.error);
      setLoading(false);
    }
    // If successful, the server action redirects automatically
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-xl border border-border animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand-600">AlCheque</h1>
          <p className="text-sm text-gray-500 mt-2">Centro de Educación Especial</p>
        </div>
        
        <form action={handleSubmit} className="space-y-4 pt-4">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              name="email"
              required
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              placeholder="usuario@centro.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input 
              type="password" 
              name="password"
              required
              minLength={6}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-70"
          >
            {loading && <Loader2 className="animate-spin mr-2" size={18} />}
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta Administrador'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            className="text-sm text-brand-600 hover:text-brand-800 transition-colors"
          >
            {isLogin ? '¿No tienes cuenta para pruebas? Regístrate aquí' : 'Ya tengo cuenta, quiero iniciar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
