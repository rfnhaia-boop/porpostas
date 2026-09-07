import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/company';
import { AppChrome } from '@/components/layout/AppChrome';
import { StoreHydrator } from '@/components/providers/StoreHydrator';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <>
      <StoreHydrator />
      <AppChrome>{children}</AppChrome>
    </>
  );
}
