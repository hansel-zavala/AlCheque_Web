import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AutoLogout } from '@/components/AutoLogout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
