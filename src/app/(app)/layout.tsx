import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/company';
import { Sidebar } from '@/components/layout/Sidebar';
import { StoreHydrator } from '@/components/providers/StoreHydrator';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <>
      <StoreHydrator />
      <div className="flex h-screen overflow-hidden bg-[var(--background)] transition-colors">
        <Sidebar />
        <main className="flex-1 overflow-y-auto ml-64 bg-[var(--background)] transition-colors">
          {children}
        </main>
      </div>
    </>
  );
}
