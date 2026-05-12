'use client';

import { Bell, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCompanyStore } from '@/store/useCompanyStore';

export function Header() {
  const pathname = usePathname();
  const { activeCompany } = useCompanyStore();

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
    <header className="h-16 bg-[#f5f5f7]/70 backdrop-blur-xl flex items-center px-8 justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight">{getPageTitle()}</h2>
        {activeCompany && (
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium border border-brand-200 shadow-sm">
            {activeCompany.name}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-5">
        <div className="relative group cursor-pointer hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#86868b]" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-9 pr-4 py-1.5 w-60 rounded-full border-none bg-[#e8e8ed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:shadow-apple text-sm transition-all text-[#1d1d1f]"
          />
        </div>

        <button className="relative text-[#86868b] hover:text-[#1d1d1f] transition-colors">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-[#f5f5f7]"></span>
        </button>

        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-[#d2d2d7]/50 flex items-center justify-center text-[#1d1d1f] group-hover:shadow-apple transition-all">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
}
