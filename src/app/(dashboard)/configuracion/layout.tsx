'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Tags, BriefcaseMedical, TriangleAlert } from 'lucide-react';

const navItems = [
  { name: 'Perfil del Centro', href: '/configuracion/perfil', icon: Building2 },
  { name: 'Categorías', href: '/configuracion/categorias', icon: Tags },
  { name: 'Servicios', href: '/configuracion/servicios', icon: BriefcaseMedical },
  { name: 'Opciones Avanzadas', href: '/configuracion/avanzado', icon: TriangleAlert },
];

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full items-start">
      {/* Sub-sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-surface rounded-2xl shadow-sm border border-border overflow-hidden sticky top-6 z-10">
        <div className="p-4 border-b border-border bg-slate-50/50 hidden lg:block">
          <h2 className="font-semibold text-slate-800">Ajustes</h2>
          <p className="text-xs text-slate-500 mt-1">Administra el sistema</p>
        </div>
        <nav className="flex flex-row lg:flex-col p-2 gap-1 overflow-x-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full">
        {children}
      </main>
    </div>
  );
}
