'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Users, 
  PieChart, 
  Settings, 
  CreditCard,
  LogOut,
  Building2,
  ChevronsUpDown,
  Stethoscope
} from 'lucide-react';
import { logout } from '@/app/(auth)/login/actions';
import { useCompanyStore } from '@/store/useCompanyStore';

const navItems = [
  { name: 'Resumen Diario', href: '/', icon: LayoutDashboard },
  { name: 'Transacciones', href: '/transacciones', icon: ArrowRightLeft },
  { name: 'Cuentas / Becas', href: '/cuentas', icon: CreditCard },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Terapeutas', href: '/terapeutas', icon: Stethoscope },
  { name: 'Flujo y Reportes', href: '/reportes', icon: PieChart },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeCompany } = useCompanyStore();

  return (
    <aside className="w-64 bg-[#f5f5f7]/80 backdrop-blur-xl border-r border-[#d2d2d7]/50 hidden md:flex flex-col h-full z-20">
      <div className="p-4 border-b border-[#d2d2d7]/50">
        <Link 
          href="/select-company"
          className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors group cursor-pointer border border-transparent hover:border-[#d2d2d7]/40 hover:shadow-sm"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Building2 size={16} />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-[#1d1d1f] truncate">
                {activeCompany?.name || 'Seleccionar Empresa'}
              </span>
              <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-medium">
                AlCheque
              </span>
            </div>
          </div>
          <ChevronsUpDown size={14} className="text-[#86868b] shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname !== '/' && pathname.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm group
                ${isActive 
                  ? 'bg-white shadow-apple text-[#1d1d1f]' 
                  : 'text-[#424245] hover:bg-[#e8e8ed]'
                }`}
            >
              <Icon size={18} className={isActive ? 'text-brand-500' : 'text-[#86868b] group-hover:text-[#1d1d1f] transition-colors'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="bg-white/60 backdrop-blur-md rounded-xl p-3 border border-[#d2d2d7]/40 flex flex-col gap-3 shadow-apple">
          <div>
            <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-0.5">Usuario</p>
            <p className="text-sm font-medium text-[#1d1d1f]">Administrador</p>
          </div>
          <button 
            onClick={() => logout()}
            className="flex items-center justify-center space-x-2 w-full py-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-lg transition-colors text-xs font-medium"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
