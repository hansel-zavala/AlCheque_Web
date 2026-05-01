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
  LogOut
} from 'lucide-react';
import { logout } from '@/app/(auth)/login/actions';

const navItems = [
  { name: 'Resumen Diario', href: '/', icon: LayoutDashboard },
  { name: 'Transacciones', href: '/transacciones', icon: ArrowRightLeft },
  { name: 'Cuentas / Becas', href: '/cuentas', icon: CreditCard },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Flujo y Reportes', href: '/reportes', icon: PieChart },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#f5f5f7]/80 backdrop-blur-xl border-r border-[#d2d2d7]/50 hidden md:flex flex-col h-full z-20">
      <div className="h-16 flex items-center px-6">
        <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">
          AlCheque
        </h1>
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
