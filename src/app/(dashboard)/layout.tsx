'use client';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AutoLogout } from '@/components/AutoLogout';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeCompany } = useCompanyStore();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Escuchar cuando Zustand termine de cargar el local storage
    const unsubHydrate = useCompanyStore.persist.onFinishHydration(() => setHasHydrated(true));
    setHasHydrated(useCompanyStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
    };
  }, []);

  useEffect(() => {
    if (hasHydrated && !activeCompany) {
      router.push('/select-company');
    }
  }, [activeCompany, router, hasHydrated]);

  // Prevent hydration mismatch and hide content until we check the store
  if (!hasHydrated) return null;

  return (
    <div className="flex h-screen bg-background">
      <AutoLogout timeoutMs={15 * 60 * 1000} />
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 animate-slide-up bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
