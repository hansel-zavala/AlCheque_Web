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
    <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col h-full shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
          AlCheque
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname !== '/' && pathname.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 group
                ${isActive 
                  ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-500'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Usuario Actual</p>
            <p className="text-sm font-semibold text-slate-800">Administrador</p>
          </div>
          <button 
            onClick={() => logout()}
            className="flex items-center justify-center space-x-2 w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
