'use client';

import { Bell, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  // Basic title mapping based on route
  const getPageTitle = () => {
    if (pathname === '/') return 'Resumen Diario';
    if (pathname.includes('/transacciones')) return 'Transacciones Bancarias';
    if (pathname.includes('/configuracion')) return 'Configuración';
    if (pathname.includes('/reportes')) return 'Reportes y Presupuestos';
    if (pathname.includes('/pacientes')) return 'Módulo Pacientes';
    if (pathname.includes('/cuentas')) return 'Cuentas por Cobrar y Becas';
    return 'Panel de Control';
  };

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center px-6 justify-between sticky top-0 z-10 animate-fade-in shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">{getPageTitle()}</h2>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative group cursor-pointer hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar recibos..." 
            className="pl-10 pr-4 py-1.5 w-64 rounded-full border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
          />
        </div>

        <button className="relative text-slate-500 hover:text-brand-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-600 group-hover:bg-brand-200 transition-colors">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
}
